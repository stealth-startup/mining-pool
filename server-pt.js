var argv = require('optimist')
  .usage('Usage: $0 -p [mining port]')
  .demand(['p'])
  .argv;

var rpc = require('./libs/jsonrpc');

var config = require('./config.json');

if(config.bitcoind_ip=='127.0.0.1') {
    // load bitcoin.conf if using local bitcoind
    var confparser=require('./libs/confparser');
    var conf={};
    try{
	conf=confparser.parseSync(config.bitcoind_path);
    } catch(e) {
	console.log("Can't find bitcoin.conf");
	process.exit(1);
    };
    if(conf.testnet=='1') {
	console.log("bitcoind is running on testnet!");
	process.exit(1);
    };
    if(conf.server!='1') {
	console.log("Set 'server=1' in bitcoin.conf");
	process.exit(1);
    };
    if(!conf.rpcport || !conf.rpcuser || !conf.rpcpassword) {
	console.log("Missing rpcport,rpcuser,rpcpassword in bitcoin.conf")
	process.exit(1);
    };
    config.bitcoind_port = conf.rpcport;
    config.bitcoind_user = conf.rpcuser;
    config.bitcoind_pwd  = conf.rpcpassword;
};

var bitcoind = require('./libs/kapitalize')({
					 'user': config.bitcoind_user,
					 'pass': config.bitcoind_pwd,
					 'host': config.bitcoind_ip,
					 'port': config.bitcoind_port
				       });

var job = new (require('./libs/jobs'))(bitcoind);

job.update_block();

var server = new rpc.Server();

var shares = 0;
var jobs = 0;
var blocks = [];
var start = +new Date();
var workers = {};

var jayson = require('jayson');
var client = jayson.client.http({
  port: 8334,
  hostname: '192.168.0.19'
});


function getwork(args, opt, callback) {
  var ip = opt.req.connection.remoteAddress;
  // console.log( ip + " Asks for job\n");
  if(!workers[ip]) workers[ip] = {"shares":0,"jobs":0,"last_seen":+new Date()};
  
  if(args.length==0) {
    workers[ip].jobs++;
    client.request('getwork',[],function(err,res){
          callback(null,res);
    });
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
      
      if(!res.staled) {
	blocks.push(block);
      };
    }
    callback(null,"truetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetruetrue");
  }
};

function update(args,opt,callback) {
  job.update_block();
  console.log("BitCoin Updated At:%s",new Date());
  callback(null,true);
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
server.expose('update',update);
server.expose('stats',stats);

server.listen(argv.p, '0.0.0.0');

