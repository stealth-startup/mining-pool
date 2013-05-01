var rpc = require('./libs/jsonrpc');
var server = new rpc.Server();
var fs=require('fs');
var argv = require('optimist')
    .usage('Usage: $0 -n [server name]-o [bitcoind rpc port] -p [mining port]')
    .demand(['o','p'])
    .argv;

var kapitalize = require('./libs/kapitalize')({
    user:'avalon',
    pass:'ngzhangshihaoren',
    host:'192.168.0.10',
    port:argv.o
  });

var shares = 0;
var dropbox_path = "/home/david/Dropbox/";

function getwork(args, opt, callback) {
  if(args.length==0) {
    kapitalize.getwork(function(err,res) {
      callback(null,res);
      });
  } else {
    shares+=1;
    kapitalize.getwork(args[0],function(err,res) {
      if(res.result==true) {
	// LMFAO!!!! We found a block!!!!!
	fs.appendFile(dropbox_path+'blocks.log',new Date());	
      }
      callback(null,"trueDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHole");
    });
  }
}


function update_share() {
  console.log(shares);
  var name = argv.n;
  var cur = (new Date()).getTime();
  var info = {"name":name,"timestamp":cur,"shares":shares};
  fs.appendFile(dropbox_path+name+'.log',JSON.stringify(info));
  shares = 0;
};

setInterval(update_share, 60*1000);

server.expose('getwork', getwork);

server.listen(argv.p, '127.0.0.1');

