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
  if(msec<0) msec = 0;
  msec = msec/1000;
  var hours = Math.floor(msec/3600);
  msec = msec%3600;
  var minutes = Math.floor(msec/60);
  msec = msec%60;
  var secs = Math.floor(msec);
  return hours + ":"+ minutes+ ":" + secs;
}

function altRows(id){
  if(document.getElementsByTagName){  
    var table = document.getElementById(id);  
    var rows = table.getElementsByTagName("tr"); 
    for(var i = 0; i < rows.length; i++){          
      if(i % 2 == 0){
        rows[i].className = "evenrowcolor";
      } else {
        rows[i].className = "oddrowcolor";
      }      
    }
  }
}

function toIPSortedArray(data) {
  var cur_ips = new Array();
  for(var k in data) {
    if (k!='undefined') cur_ips.push(k);
  }
  cur_ips.sort(function(a,b) {
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
  var res = new Array();
  cur_ips.forEach(function(ip){
                    data[ip].ip=ip;
                    data[ip].link = toLink(ip);
                    res.push(data[ip]);
                  });
  return res;     
}

function toLink(ip) {
  return "<a href=\"http://" + ip + ":8000\">" + ip + "</a>";
}

function poolstatus(url) {
  var self = this;
  this.url = url;
  this.hashrate = 0;
  this.shares = [];
  this.jobs = 0;
  this.blocks = [];
  this.start = +new Date();
  this.workers = {};

  this.make_url = function(hash) {
    return '<a href="https://blockchain.info/block-index/'+hash+ '">' + hash + '</a>';
  };

  this.render_blocks = function() {
    var blocks_text = "<table class='altrowstable' id='alternateblock'><tr><th>Block Hash</th><th>Mined At</th></tr>";
    self.blocks.forEach(function(block) {
                          var text = "<tr>";
                          text += "<td>"+ self.make_url(block.hash) +"</td>";
                          text += "<td>"+ block.timestamp.toLocaleString() +"</td>";
                          text += "</tr>";
                          blocks_text += text;
                        });
    blocks_text += "</table>";
    $("#blocks").html(blocks_text);
    altRows('alternateblock');
  },

  this.render_data = function(data) {
    var tpl_data = "<table class='altrowstable' id='alternateworker'><tr><th>Worker</th><th>Shares</th><th>Hash Rate</th><th>Last Seen</th><tr>" + 
      "{{#workers}}<tr><td>{{&link}}</td><td>{{last_shares}}</td><td>{{ghs}}</td><td>{{last_seen}}</td></tr>{{/workers}}</table>";
    var tpl_header = 
      "<table><tr><td align='right'><b>Server:</b></td><td>{{url}}</td></tr>" + 
      "<tr><td align='right'><b>Height:</b></td><td>{{height}}</td></tr>" + 
      "<tr><td align='right'><b>Shares:</b></td><td>{{shares}}</td></tr>" + 
      "<tr><td align='right'><b>Hashrate:</b></td><td>{{hashrate}} GH/s</td></tr>" +
      "<tr><td align='right'><b>Uptime:</b></td><td>{{uptime}}</td></tr>"  +    
      "<tr><td align='right'><b>Workers:</b></td><td>{{workers.length}}</td></tr></table>";
    var html_data = Mustache.to_html(tpl_data, data);
    var html_header = Mustache.to_html(tpl_header, data);
    $("#data").html(html_data);
    $("#info").html(html_header);
    altRows('alternateworker');
    this.render_blocks();
  },

  this.refresh = function(callback) {
    $.getJSON(self.url + "/stats/?callback=?", null, function(responseData) {
	       console.log(responseData);
               var data = JSON.parse(responseData);
               var result = {};
               result.uptime = to_dur(+new Date()-data.start);
               var cur_workers = JSON.parse(data.workers);
               for(var ip in cur_workers) {
                 var last_seen = to_dur_short(new Date() - cur_workers[ip].last_seen);
                 var cur_worker = cur_workers[ip];
                 cur_worker.last_seen = last_seen;
                 var now = +new Date();
                 if(self.workers[ip]) {
				   self.workers[ip].last_shares = cur_worker.shares;
                   var ghs;
                   if(self.workers[ip].shares.length>=10) {                     
                     self.workers[ip].shares = self.workers[ip].shares.slice(1);  
                     ghs = ((cur_worker.shares-self.workers[ip].shares[0][0])/(now-self.workers[ip].shares[0][1])*4200).toFixed(2);
                   } else {
                     ghs = 0;     
                   }
                   self.workers[ip].shares.push([cur_worker.shares,now]);
                   self.workers[ip].ghs = ghs;                   
                 } else {                   
                   self.workers[ip] = cur_worker;
                   self.workers[ip].last_shares = cur_worker.shares;
                   self.workers[ip].shares = [[self.workers[ip].shares,now]];
                   self.workers[ip].ghs = 0;
                 };
                 self.workers[ip].last_seen = last_seen;
               };
               self.blocks = data.blocks;
               result.height = data.height;
               result.workers = toIPSortedArray(self.workers);
               result.hashrate = result.workers.reduce(function(prev,cur){return prev+parseFloat(cur.ghs);},0).toFixed(2);
               result.url = self.url;
               result.shares = data.shares;
               result.height = data.height;
               self.render_data(result);
             });
  };
};
