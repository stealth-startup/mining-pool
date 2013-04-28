var rpc = require('./jsonrpc');

var server = new rpc.Server();

function add(args, opt, callback) {
  callback(null, args[0] + args[1]);
}
server.expose('add', add);

server.listen(8000, 'localhost');
