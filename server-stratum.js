var argv = require('optimist')
  .usage('Usage: $0 -p [mining port]')
  .demand(['p'])
  .argv;

var rpc = require('./libs/jsonrpc');

var job = require('./libs/stratum');

var server = new rpc.Server();

var shares = 0;
var jobs = 0;
var blocks = [];
var start = +new Date();
var workers = {};

function getwork(args, opt, callback) {
  var ip = opt.req.connection.remoteAddress;
  // console.log( ip + " Asks for job\n");
  if(!workers[ip]) workers[ip] = {"shares":0,"jobs":0,"last_seen":+new Date()};
  
  if(args.length==0) {
    workers[ip].jobs++;
    callback(null,job.getwork());
  } else {
    shares++;
    // console.log( ip + " Submits share");
    workers[ip].shares++;
    workers[ip].last_seen = +new Date();
    var res = job.submit(args[0].slice(0,160));
    // console.log(res);
    if(res.found) {
      var block = {};
      block.hash = res.hash;
      block.timestamp = (new Date()).toLocaleString();
      blocks.push(block);
    }
    callback(null,true);
  }
};

function stats(args,opt,callback) {
  var response = {};
  response.blocks = blocks;
  response.start = start;
  response.height = job.height;
  response.shares = shares;
  response.workers = JSON.stringify(workers);
  callback(null,JSON.stringify(response));
};

server.expose('getwork', getwork);
server.expose('stats',stats);
server.listen(argv.p, '0.0.0.0');

