var argv = require('optimist')
    .usage('Usage: $0 -f [config_file]')
    .demand(['f'])
    .default({'m':'r'})
    .argv;

var config=require("./"+argv.f);

var urls = Object.keys(config).map(function(url){return [url.slice(0,-5),url.slice(-4)];});

var daemons = urls.map(function(url){return new (require('./status'))(url[0],url[1]);});


var faye = require('faye');

var client;

if(argv.m=='r') {
  console.log("Remote Server");
  client = new faye.Client('http://54.250.174.46/faye');
} else {
  console.log("Local Server");
  client = new faye.Client('http://localhost/faye');
}

var clientAuth = {
  outgoing: function(message, callback) {
    // Add ext field if it's not present
    if (!message.ext) message.ext = {};

    // Set the auth token
    message.ext.authToken = 'PinkFloydIsTheWorst';

    // Carry on and send the message to the server
    callback(message);
  }
};

client.addExtension(clientAuth);

// client.subscribe('/command',function(msg){
//   console.log(msg);
// });

var async = require('async');

var count = 0;

function send_msg() {
  async.map(daemons,function(daemon,callback){
    daemon.refresh(function(stat){callback(null,stat);});
  },function(error,results){
    if(error) {
      console.log(error);process.exit(1);
    };
    var msg = results.map(function(res){
      var info =  { url:res.url, alive:res.alive, hashrate:res.hashrate, blocks:res.blocks , workers:Object.keys(res.workers).length };
      return info;
    });
    client.publish('/stat',msg);
    count++;
    console.log(count+"  "+new Date());
    console.log("sent msg:"+JSON.stringify(msg));
  });
};


var interval = 20;
setInterval(send_msg,interval*1000);
send_msg();
