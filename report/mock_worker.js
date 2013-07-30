var argv = require('optimist')
  .usage('Usage: $0 -p [mining port]')
  .demand(['p'])
  .argv;

var rpc = require('../libs/jsonrpc');

var server = new rpc.Server();

var shares = 0;
var jobs = 0;
var blocks = [];
var start = +new Date();
var workers = {'192.168.100.1':{'shares': 1000,'last_seen': +new Date()} ,'192.168.100.2':{'shares':1002,'last_seen':+new Date()}};

function stats(args,opt,callback) {
  var response = {};
  response.blocks = blocks;
  response.start = start;
	for(var ip in workers) {
		workers[ip].shares += Math.floor(Math.random()*10);
		workers[ip].last_seen = +new Date() - Math.floor(Math.random()*10)*1000;
	}
  response.workers = JSON.stringify(workers);
  callback(null,JSON.stringify(response));
};

server.expose('stats',stats);

server.listen(argv.p, '0.0.0.0');


