var config = require('../config.json');

var bitcoind = require('./kapitalize')({
					 'user': config.bitcoind_user,
					 'pass': config.bitcoind_pwd,
					 'host': config.bitcoind_ip,
					 'port': config.bitcoind_port
				       });


var job = new (require('./fake_jobs'))(bitcoind);

var label = "10000 getwork";

console.time("getblocktemplate");
job.update_block();
console.timeEnd("getblocktemplate");

console.time(label);

for(var i=0;i<100000;i++) {
  job.getwork();
}

console.timeEnd(label);
