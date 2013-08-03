var argv = require('optimist')
    .usage('Usage: $0 -p [port]')
    .default({'p':80})
    .argv;

var express = require('express');
var cons = require('consolidate');
var faye = require('faye');

var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  timeout:  45
});

var merge = require('./merge');

var server_count = 0;

var pools  = {};
pools.info = [];

var app = express();
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});


app.engine('html',cons.mustache);
app.set('view engine','html');
app.set('views', __dirname + '/views');

app.get('/',function(req,res){ 
  // total_ghs = 0;
  // for(var url in pools) {
  //   total_ghs += parseFloat(pools[url].hashrate);
  // }
  // var body = "Total Hash Rate:"+total_ghs+'</br>';
  var total_ghs = 0;
  for(var pool in Object.keys(pools.info)) {
    total_ghs+=parseFloat(pools.info[pool].hashrate);
  }
  pools.total_ghs=total_ghs.toFixed(2);
  res.render('index',pools);
});

app.get('/command/:name', function(req, res) {
  bayeux.getClient().publish('/command', {text: req.params.name});
  res.send(200);
});


bayeux.bind('publish', function(clientId, channel, data) {
  if(channel=='/stat') {
    pools.info = merge(pools.info,data);
  };
});

var server = app.listen(argv.p);
bayeux.attach(server);
