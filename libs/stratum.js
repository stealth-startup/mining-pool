var net = require('net');

var methods = {
  subscribe : "mining.subscribe",
  authorize : "mining.authorize",
  submit : "mining.submit"
};

var notifys = {
  job : "mining.notify",
  diff : "mining.set_difficulty"
};

var crypto = require('crypto');
var dhash = function(x) {return crypto.createHash('sha256').update(crypto.createHash('sha256').update(x).digest()).digest();};

var sha256;
var is_native;
try {
  sha256 = require('./midstate/build/Release/hashlib');
  is_native = true;
} catch(e) {
  sha256 = new (require('./sha256')).Sha256();                         
  is_native = false;
}

var job = {
  job_id:1,
  diff:1,
  prevhash:'',
  coinb1:'',
  coinb2:'',
  version:'',
  bits:'',
  ntime:+new Date(),
  merkle_branch:[],
  extranonce1:0,
  extranonce2:0,
  extranonce2_size:0,
  clean:true
};


function info(msg){
  console.log("[%s]%s",new Date(),msg);
}

function stratumSend(method,params,id) {
  var data =  {id:id,method:method,params:params};
  info("Sending: "+JSON.stringify(data));
  client.write(JSON.stringify(data)+'\n');
}

function stratumSubscribe(callback) {
  stratumSend(methods.subscribe,[]);
}

function stratumAuthorize(user,pass) {
  stratumSend(methods.authorize,[user,pass]);
}

// {"params": ["slush.miner1", "bf", "00000001", "504e86ed", "b2957c02"], "id": 4, "method": "mining.submit"}
function stratumSubmit(worker,job_id,extranonce2,ntime,nonce){
  stratumSend(methods.submit,[worker,job_id,extranonce2,ntime,nonce],999);
}

var host = "stratum.btcguild.com";
var port = 3333;

info("Connecting to "+host+":"+port);

var client = net.connect(
  {port:port,host:host},
  function() {
    info('Client Connected');
    client.emit('subscribe');
  });

function handleResponse(res){
  if(res.id==999) {
    if(res.result==true) {
      info("Share Accepted");
    } else {
      info("Share Rejected");
    }
  } else {
    if(Array.isArray(res.result)) {
      job.extranonce1=res.result[1];
      job.extranonce2_size=res.result[2];
      client.emit('authorize');
    } else if(res.method==notifys.job) {
      client.emit('job',res.params);
    } else if(res.method==notifys.diff) {
      client.emit('diff',res.params[0]);
    } else if(res.result==true) {
      info("Authorized");
    }
  }
};


var chunk='';

client.on('data', function(data) {
  var recv = data.toString();
  // info("Received: "+ recv);
  chunk+=recv;
  if(recv.slice(-1)=='\n') {
    var jsons = chunk.trim().split('\n');
    chunk='';
    for(var i=0;i<jsons.length;i++){
      var res;
      try {
	res = JSON.parse(jsons[i]);
	handleResponse(res);
      } catch(err) {
	console.log("Cant parse: "+jsons[i]);
      };
    }
  }
  
});

client.on('end', function() {
  info('client disconnected');
});

client.on('subscribe', function () {
  info("Subscribing");
  stratumSubscribe();
});

client.on('authorize', function () {
  stratumAuthorize('naituida_1','123');
});

client.on('diff',function(diff) {
  info("Setting Difficulty " + diff);
  job.diff=diff;
});

client.on('job',function(params) {
  info("Get New Job: " + JSON.stringify(params));
  job.job_id=params[0];
  job.prevhash=params[1];
  job.coinb1=params[2];
  job.coinb2=params[3];
  job.merkle_branch=params[4];
  job.version=params[5];
  job.bits=params[6];
  job.ntime=params[7];
  job.clean=params[8];
});

function formatExtranonce2(){
  var size=job.extranonce2_size;
  return ('000000000000000000000000000000'+job.extranonce2.toString(16)).slice(-2*size);
}

function getwork() {
}


function submit(data) {
}

// setInterval(function(){console.log(job);},5000);
