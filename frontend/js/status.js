function poolstatus(url) {
  var self = this;
  this.url = url;
  this.hashrate = 0;
  this.shares = 0;
  this.jobs = 0;
  this.blocks = [];
  this.stales = [];
  this.start = +new Date();

  this.make_url = function(hash) {
    return '<a href="http://blockexplorer.com/block/'+hash+ '">' + hash + '</a>';
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
    $("#stales").text(JSON.stringify(self.stales));
  },
  
  this.render = function() {
    $("#shares").text(self.shares+" Shares");
    $("#jobs").text(self.jobs+" Jobs");
    $("#hashrate").text(self.hashrate+" GH/s");
    this.render_blocks();
  };

  this.render_data = function(data) {
    $("#data").text(JSON.stringify(data));
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
	// self.render_data(data);
	var cur_time = +new Date();
	self.shares = data.shares;
	self.jobs = data.jobs;
	self.blocks = data.blocks;
	self.stales = data.stales;
	self.hashrate = self.shares/((cur_time-self.start)/1000.0) * 4.2;
	self.render();
      },
      error: function (responseData, textStatus, errorThrown) {
	$("#msg").text("Cannot connect to server");
      }
    });
  };
};
