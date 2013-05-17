function poolstatus(url) {
  var self = this;
  this.url = url;
  this.hashrate = 0;
  this.shares = 0;
  this.jobs = 0;
  this.blocks = [];
  this.stales = [];
  this.start = +new Date();

  this.render_blocks = function() {
    $("#blocks").text(JSON.stringify(self.blocks));
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
	self.render_data(data);
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
