var net = require('net');
var toggle = require('endian-toggle');
var bignum = require('bignum');
var buffertools = require('buffertools');

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
  worker_name:'naituida_1',
  diff:1,
  target:'',
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
  clean:true,
  merkle_to_extranonce2:{}
};


function info(msg){
  console.log("[%s]%s",new Date(),msg);
}

function diff2target(diff){
  var max = bignum.pow(2,16).sub(1).mul(bignum.pow(2,208));
  var cur = max.div(diff).toString(16);
  return toggle(new Buffer(("0000000000000000000000000000000000000000000000000000000000000000"+cur).slice(-64),'hex'),32).toString('hex');
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
  stratumAuthorize(job.worker_name,'123');
});

client.on('diff',function(diff) {
  info("Setting Difficulty " + diff);
  job.diff=diff;
  job.target=diff2target(diff);
});

client.on('job',function(params) {
  info("Get New Job: " + JSON.stringify(params));
  job.extranonce2=0;
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

function formatExtranonce2(extranonce2){
  var size=job.extranonce2_size;
  return ('000000000000000000000000000000'+extranonce2.toString(16)).slice(-2*size);
}

function getwork() {
  var extranonce2 = job.extranonce2;
  job.extranonce2+=1;
  var coinbase_tx = new Buffer(job.coinb1+job.extranonce1+formatExtranonce2(extranonce2)+job.coinb2,'hex');
  var coinbase_hash = dhash(coinbase_tx);
  var merkle_root_bin = toggle(job.merkle_branch.reduce(function(a,b){return dhash(a.concat(b));},coinbase_hash).reverse(),32);
  var merkle_root = merkle_root_bin.toString('hex');
  job.merkle_to_extranonce2[merkle_root]=extranonce2;
  var data = job.version + job.prevhash + merkle_root + job.ntime + job.bits + "00000000" + "000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000";
  var midstate = sha256.midstate(data.slice(0,128));
  var work= {"midstate":midstate,"data":data,"hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":"00000000ffff0000000000000000000000000000000000000000000000000000"};
  info("GetWork: "+JSON.stringify(work));
  return work;
}


function submit(data) {
  var buf = toggle(new Buffer(data,'hex'),32);
  var hash = dhash(buf).reverse();
  var res = ('0000000000000000000000000000000000000000000000000000000000000000'+hash.toString('hex')).slice(-64);
  var target = job.target;
  var pow = res<target;
  if(pow) {
    var nonce = data.slice(-8);
    var merkle_root = data.slice(72,136);
    var extranonce2 = job.merkle_to_extranonce2[merkle_root];
    stratumSubmit(job.worker_name, job.job_id, extranonce2, job.ntime, nonce);
  }
  return {'found':pow,'hash':res};
}

job.getwork = getwork;
job.submit = submit;
module.exports = job;
