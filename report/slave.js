var faye = require('faye');
var p1 = new (require('./status'))('192.168.0.19',8334);
var p2 = new (require('./status'))('192.168.0.19',8335);
var p3 = new (require('./status'))('192.168.0.19',8336);

var client = new faye.Client('http://54.250.174.46/faye');
// var client = new faye.Client('http://localhost:8123/faye');

client.subscribe('/command',function(msg){
  console.log(msg);
});


function send_msg() {
  p1.refresh(function(stat){
    var msg = { url:stat.url, hashrate:stat.hashrate, blocks:stat.blocks , workers:Object.keys(stat.workers).length };
    console.log(msg);
    client.publish('/stat',msg);
  });
  p2.refresh(function(stat){
    var msg = { url:stat.url, hashrate:stat.hashrate, blocks:stat.blocks , workers:Object.keys(stat.workers).length };
    console.log(msg);
    client.publish('/stat',msg);
  });
  p3.refresh(function(stat){
    var msg = { url:stat.url, hashrate:stat.hashrate, blocks:stat.blocks , workers:Object.keys(stat.workers).length };
    console.log(msg);
    client.publish('/stat',msg);
  });
}

setInterval(send_msg,2000);
