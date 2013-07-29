var express = require('express'),
    faye = require('faye');

var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  timeout:  45
});

var server_count = 0;
var pools = {};
var total_ghs = 0;

var app = express();
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.get('/',function(req,res){ 
  total_ghs = 0;
  for(var url in pools) {
    total_ghs += parseFloat(pools[url].hashrate);
  }
  var body = "Total Hash Rate:"+total_ghs+'</br>';
  // res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.send(body);
});

app.get('/command/:name', function(req, res) {
  bayeux.getClient().publish('/command', {text: req.params.name});
  res.send(200);
});


bayeux.bind('publish', function(clientId, channel, data) {
  console.log(channel);
  if(channel=='/stat') {
    var url = data.url;
    pools[url] = data;
    console.log(pools);
  };
});

var server = app.listen(8123);
bayeux.attach(server);
