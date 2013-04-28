var rpc = require('./jsonrpc');

var job = new (require('./jobs'))();

var server = new rpc.Server();

job.update_block();

var kapitalize = require('./kapitalize')({
    user:'naituida',
    pass:'123',
    host:'192.168.0.2',
    port:8080
  });

function getwork(args, opt, callback) {
  if(args==[]) {
    callback(null,job.getwork());
  } else {
    kapitalize.getwork(args,function(err,res) {
      callback(null,res);
    });
  }
}

server.expose('getwork', getwork);

server.listen(8334, 'localhost');
