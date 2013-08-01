var jayson = require('jayson');

function msec_to_dur(msec) {
  msec = msec/1000;
  var hours = Math.floor(msec/3600);
  msec = msec%3600;
  var minutes = Math.floor(msec/60);
  msec = msec%60;
  var secs = Math.floor(msec);
  return {'hours':hours,'minutes':minutes,'seconds':secs};
}

function compare_ip(a,b) {
  var num_a = a.split('.');
  var num_b = b.split('.');
  var test = (parseInt(num_a[2])*1000+parseInt(num_a[3])) - (parseInt(num_b[2])*1000+parseInt(num_b[3]));
  if(test>0) {
    return 1;
  } else if(test<0) {
    return -1;
  } else return 0;
}

function PoolStatus(host,port) {
  var self = this;
  this.url = host+':'+port;
  this.hashrate = 0;
  this.shares = [];
  this.jobs = 0;
  this.blocks = [];
  this.start = +new Date();
  this.workers = {};
  this.uptime = {};

  var samples = 5;

  var client = jayson.client.http({
    port: port,
    hostname: host
  });
  
  function get_stats(client,callback) {
    client.request('stats', [], function(err, response) {
      if(err) throw err;
      callback(response);
    });
  };  

  this.handle_response = function(response) {
    var data = JSON.parse(response.result);
    var result = {};
    self.uptime = msec_to_dur(+new Date()-data.start);
    var cur_workers = JSON.parse(data.workers);
    
    for(var ip in cur_workers) {
      var cur_worker = cur_workers[ip];
      var last_seen = msec_to_dur(new Date() - cur_worker.last_seen);
      cur_worker.last_seen = last_seen;
      if(self.workers[ip]) {
	var ghs;
	if(self.workers[ip].shares.length>=samples) {
	  self.workers[ip].shares = self.workers[ip].shares.slice(1);  
	  self.workers[ip].updated = self.workers[ip].updated.slice(1);  
	  ghs = ((cur_worker.shares-self.workers[ip].shares[0])/(+new Date()-self.workers[ip].updated[0])*1000*4.2).toFixed(2);
	} else {
	  ghs = 0;		     
	}
	self.workers[ip].shares.push(cur_worker.shares);
	self.workers[ip].updated.push(+new Date());
	self.workers[ip].ghs = ghs;
      } else {
	self.workers[ip] = cur_worker;
	self.workers[ip].shares = [self.workers[ip].shares];
	self.workers[ip].updated = [+new Date()];
	self.workers[ip].ghs = 0;
      };
      self.workers[ip].last_shares = cur_worker.shares;
    };
    
    self.blocks = data.blocks;

    // self.hashrate = Object.keys(self.workers).reduce(function(prev,cur){return prev+parseFloat(self.workers[cur].ghs);},0).toFixed(2);
    self.hashrate = (data.shares/(+new Date()-data.start)*1000*4.2).toFixed(2);
  };

  this.refresh = function(callback) {
    get_stats(client,self.handle_response);
    callback(self);
  };
}

module.exports = PoolStatus;
