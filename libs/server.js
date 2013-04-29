var rpc = require('./jsonrpc');

var job = new (require('./jobs'))();

var server = new rpc.Server();

job.update_block();

var kapitalize = require('./kapitalize')({
    user:'naituida',
    pass:'123',
    host:'127.0.0.1',
    port:8080
  });

// sample submit 
var header= '000000022afb67434e2b7e2170bbfaba3f6b841e1e12f1a3793e2a5b05f090840000000044a7ca7282c17727b818d3babb853e99249e69a64c290b35826dec7bbb3a27e2517d49631c063051d9a71100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080020000';

function getwork(args, opt, callback) {
  if(args.length==0) {
    callback(null,job.getwork());
  } else {
    kapitalize.getwork(args[0],function(err,res) {
      callback(null,res.result);
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

server.listen(8334, 'localhost');
