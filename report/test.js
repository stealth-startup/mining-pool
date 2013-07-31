var jayson = require('jayson');

var client = jayson.client.http({
  port: 8334,
  hostname: '192.168.0.19'
});

client.request('stats', [], function(err, response) {
  if(err) throw err;
  console.log(response); 
});
