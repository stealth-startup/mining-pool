var rpc = require('./libs/jsonrpc');
var server = new rpc.Server();
var argv = require('optimist')
    .usage('Usage: $0 -o [bitcoind rpc port] -p [mining port]')
    .demand(['o','p'])
    .argv;

var kapitalize = require('./libs/kapitalize')({
    user:'avalon',
    pass:'ngzhangshihaoren',
    host:'192.168.0.10',
    port:argv.o
  });

function getwork(args, opt, callback) {
  if(args.length==0) {
    kapitalize.getwork(function(err,res) {
      callback(null,res);
      });
  } else {
    kapitalize.getwork(args[0],function(err,res) {
      callback(null,"trueDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHole");
    });
  }
}

server.expose('getwork', getwork);

server.listen(argv.p, '127.0.0.1');

