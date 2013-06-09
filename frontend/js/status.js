function to_dur(msec) {
  msec = msec/1000;
  var hours = Math.floor(msec/3600);
  msec = msec%3600;
  var minutes = Math.floor(msec/60);
  msec = msec%60;
  var secs = Math.floor(msec);
  return hours + " Hours "+ minutes+ " Minutes "+ secs + " Seconds";
}

function to_dur_short(msec) {
  msec = msec/1000;
  var hours = Math.floor(msec/3600);
  msec = msec%3600;
  var minutes = Math.floor(msec/60);
  msec = msec%60;
  var secs = Math.floor(msec);
  return hours + ":"+ minutes+ ":" + secs;
}


function poolstatus(url) {
  var self = this;
  this.url = url;
  this.hashrate = 0;
  this.shares = [];
  this.jobs = 0;
  this.blocks = [];
  this.stales = [];
  this.start = +new Date();

  this.make_url = function(hash) {
    return '<a href="https://blockchain.info/block-index/'+hash+ '">' + hash + '</a>';
  };

  this.render_blocks = function() {
    var blocks_text = "<table><tr><th>Block Hash</th><th>Mined At</th><th>Shares</th></tr>";
    self.blocks.forEach(function(block) {
      var text = "<tr>";
      text += "<td>"+ self.make_url(block.hash) +"</td>";
      text += "<td>"+ block.timestamp.toLocaleString() +"</td>";
      text += "<td>"+ block.shares +"</td>";
      text += "</tr>";
      blocks_text += text;
    });
    blocks_text += "</table>";
    $("#blocks").html(blocks_text);
    //$("#stales").text(JSON.stringify(self.stales));
  },
  
  this.render = function() {
    $("#shares").text(self.shares+" Shares");
    $("#jobs").text(self.jobs+" Jobs");
    $("#hashrate").text(self.hashrate+" GH/s");
    this.render_blocks();
  };

  this.render_data = function(data) {

    var tpl = "Uptime {{uptime}}:<table><tr><th>Worker</th><th>Jobs</th><th>Shares</th><th>Last Seen</th><tr>" + 
      "{{#workers}}<tr><td>{{ip}}</td><td>{{jobs}}</td><td>{{shares}}</td><td>{{last_seen}}</td></tr>{{/workers}}</table>";
    
    var html = Mustache.to_html(tpl, data);
    $("#data").html(html);
  };

  this.refresh = function(callback) {
    $.ajax({
	     type: 'POST',
	     url: self.url,
	     crossDomain: true,
	     data: '{"jsonrpc":"2","id":"1","method":"stats","params":[]}',
	     dataType: 'json',
	     success: function(responseData, textStatus, jqXHR) {
	       $("#msg").text("");
	       var data = JSON.parse(responseData.result);
	       var result = {};
	       result.uptime = to_dur(+new Date()-data.start);
	       
	       var stats = new Array();
	       var workers = JSON.parse(data.workers);
	       var client_ips = new Array();
	       for(var k in workers) client_ips.push(k);
	       console.log(client_ips);
	       client_ips.sort(function(a,b) {
				 var num_a = a.split('.');
				 var num_b = b.split('.');
				 var test = (parseInt(num_a[2])*1000+parseInt(num_a[3])) - (parseInt(num_b[2])*1000+parseInt(num_b[3]));
				 if(test>0) {
				   return 1;
				 } else if(test<0) {
				   return -1;
				 } else return 0;
			       }
			      );
	       
	       client_ips.forEach(function(ip) {
				    workers[ip].ip = ip;
				    workers[ip].last_seen = to_dur_short(new Date() - workers[ip].last_seen);
				    stats.push(workers[ip]);
				  });

	       
	       result.workers = stats;
	       
	       self.render_data(result);

	       // self.blocks = data.blocks;

	
	       // self.render_data(data);
	       // var cur_time = +new Date();
	       // self.shares = data.shares;
	       // self.jobs = data.jobs;
	       // self.stales = data.stales;
	       // self.hashrate = self.shares/((cur_time-data.start)/1000.0) * 4.2;
	       // self.render();
      },
	     error: function (responseData, textStatus, errorThrown) {
	       $("#msg").text("Cannot connect to server");
	     }
	   });
  };
};
