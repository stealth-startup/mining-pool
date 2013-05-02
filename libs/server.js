var rpc = require('./jsonrpc');

var job = new (require('./jobs'))();

var server = new rpc.Server();

var async = require('async');

job.update_block();

function getwork(args, opt, callback) {
  if(args.length==0) {
    callback(null,job.getwork());
  } else {
    job.submit(args[0].slice(0,160));
    callback(null,"trueDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHoleDannyIsAFuckingAssHole");
  }
};

function update_block(args,opt,callback) {
  job.update_block();
  console.log("Updated At:%s",new Date());
  callback(null,true);
};

server.expose('getwork', getwork);
server.expose('update',update_block);

server.listen(8334, '0.0.0.0');

