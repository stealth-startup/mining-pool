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


//app.engine('html',cons.mustache);
app.set('view engine','html');
app.set('views', __dirname + '/views');
app.enable('view cache');
app.engine('html',require('hogan-express'));
app.set('layout', 'layout');
//app.set('partials', head: "head") # partails using by default on all pages


app.get('/',function(req,res){ 
  // total_ghs = 0;
  // for(var url in pools) {
  //   total_ghs += parseFloat(pools[url].hashrate);
  // }
  // var body = "Total Hash Rate:"+total_ghs+'</br>';
  var total_ghs = 0;
  for(var i=0;i<pools.info.length;i++){
    total_ghs+=parseFloat(pools.info[i].hashrate);
  }
  pools.total_ghs=total_ghs.toFixed(2);
  console.log(total_ghs);
  connection(function(db){
	       db.collection('hashrate')
		 .find()
		 .sort( { '_id' : -1 } )
		 .limit(60480)
		 .toArray(function(err,arr){
			    var series = arr.map(function(item){return [item.time,parseFloat(item.rate)/1000];}).reverse();
			    res.render('index',{'rate':(total_ghs/1000).toFixed(4),'series':JSON.stringify(series)});
			  });
	     });
});

app.get('/command/:name', function(req, res) {
  bayeux.getClient().publish('/command', {text: req.params.name});
  res.send(200);
});

var connection = require('./connection');

bayeux.bind('publish', function(clientId, channel, data) {
  if(channel=='/stat') {
    pools.info = merge(pools.info,data);
    var total_ghs = 0;
    var blocks = [];
    for(var i=0;i<pools.info.length;i++){
      total_ghs+=parseFloat(pools.info[i].hashrate);
      blocks = merge(blocks,pools.info[i].blocks);
    }
    pools.total_ghs=total_ghs.toFixed(2);
    console.log("got message");
    console.log(blocks);
    connection(function(db) {
      db.collection('hashrate',function(err,col){
	col.insert({'rate':pools.total_ghs,'time':+new Date()},{w:1},function(){});
	blocks.map(function(block){
	  col.update({'hash':block.hash},{'hash':block.hash,'time':+ new Date(block.timestamp)},{upsert:true});
	});
      });
    });
    //    console.log(data);
  };
});

var server = app.listen(argv.p);

var serverAuth = {
  incoming: function(message, callback) {
    // Get subscribed channel and auth token
    var subscription = message.subscription,
        msgToken     = message.ext && message.ext.authToken;

    console.log(message.ext);
    if (msgToken!=='PinkFloydIsTheWorst')
      message.error = 'Invalid subscription auth token';
    // Call the server back now we're done
    callback(message);
  }
};

bayeux.addExtension(serverAuth);

bayeux.attach(server);
