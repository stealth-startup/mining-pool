var rpc = require('./jsonrpc');

var job = new (require('./jobs'))();

var server = new rpc.Server();

var async = require('async');

job.update_block();

var kapitalize = require('./kapitalize')({
    user:'naituida',
    pass:'123',
    host:'127.0.0.1',
    port:8080
  });

function getwork(args, opt, callback) {
  if(args.length==0) {
    callback(null,job.getwork());
  } else {
    kapitalize.getwork(args[0],function(err,res) {
      // callback(null,res.result);
      console.log(res);
      callback(null,"trueDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHole");
    });
  }
}

function update_block(args,opt,callback) {
  job.update_block();
  console.log("Updated At:%s",new Date());
  callback(null,true);
}

server.expose('getwork', getwork);
server.expose('update',update_block);

server.listen(8334, '192.168.1.104');

