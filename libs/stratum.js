var net = require('net');
var toggle = require('endian-toggle');
var bignum = require('bignum');
var buffertools = require('buffertools');

var moment = require('moment');

var winston = require('winston');

var myCustomLevels = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  colors: {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  }
};

winston.addColors(myCustomLevels.colors);

var logger = new (winston.Logger)({
  levels: myCustomLevels.levels,
  transports: [
    new (winston.transports.Console)({timestamp:function(){return moment().format('YYYY-M-D HH:mm:ss Z');},
				      level:'debug',
				      colorize:true})
  ]});

var debug = logger.debug;
var info = logger.info;
var warn = logger.warn;
var error = logger.error;

var methods = {
  subscribe : "mining.subscribe",
  authorize : "mining.authorize",
  submit : "mining.submit"
};

var notifys = {
  job : "mining.notify",
  diff : "mining.set_difficulty",
  reconnect : "client.reconnect"
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

var delta;

var job = {
  job_id:1,
  // slush
  // worker_name:'naituida.worker1',
  // worker_pwd:'gqAPadP7',
  // btcguild
  // worker_name:'naituida_1',
  // worker_pwd:'123',
  // ghash.io
  worker_name:'',
  worker_pwd:'',
  diff:1,
  target:'',
  target_orig:'',
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



function diff2target(diff){
  var max = bignum.pow(2,16).sub(1).mul(bignum.pow(2,208));
  var cur = max.div(diff).toString(16);
  return (new Buffer(("0000000000000000000000000000000000000000000000000000000000000000"+cur).slice(-64),'hex')).reverse().toString('hex');
}

function stratumSend(client,method,params,id) {
  var data =  {id:id,method:method,params:params};
  debug("Sending: "+JSON.stringify(data));
  client.write(JSON.stringify(data)+'\n');
}

function stratumSubscribe(client,callback) {
  stratumSend(client,methods.subscribe,[]);
}

function stratumAuthorize(client,user,pass) {
  stratumSend(client,methods.authorize,[user,pass]);
}

var share_id=999;

// {"params": ["slush.miner1", "bf", "00000001", "504e86ed", "b2957c02"], "id": 4, "method": "mining.submit"}
function stratumSubmit(client,worker,job_id,extranonce2,ntime,nonce){
  stratumSend(client,methods.submit,[worker,job_id,extranonce2,ntime,nonce],share_id);
  // share_id+=1;
}

// var host = 'stratum.bitcoin.cz';
// var host = "stratum.btcguild.com";
// var host = 'uk1.ghash.io';
// var port = 3333;


var client;
var host;
var port;

function connect() {
  info("Connecting to "+host+":"+port);
  client = net.connect(
    {port:port,host:host},
    function() {
      info('Client Connected');
      client.emit('subscribe');
    });
  client.on('data', function(data) {
    var recv = data.toString();
    debug("Received: "+ recv);
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
    // process.exit(1);
  });

  client.on('subscribe', function () {
    info("Subscribing");
    stratumSubscribe(client);
  });

  client.on('authorize', function () {
    stratumAuthorize(client,job.worker_name,job.worker_pwd);
  });

  client.on('diff',function(diff) {
    info("Setting Difficulty " + diff);
    job.diff=diff;
    job.target=diff2target(diff);
    job.target_orig = (new Buffer(job.target,'hex')).reverse().toString('hex');
  });

  client.on('job',function(params) {
    // info("Get New Job: " + JSON.stringify(params));
    info("Get New Job");
    debug("Job ID: x%s",params[0]);
    debug("Prevhash: %s",params[1]);
    debug("Coinb1: %s",params[2]);
    debug("Coinb2: %s",params[3]);
    debug("Merkle Branch: %s",JSON.stringify(params[4]));
    debug("Version: %s",params[5]);
    debug("Bits: %s",params[6]);
    debug("Ntime: %s",params[7]);
    debug("Clean: %s",params[8]);
    
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
    delta = parseInt(job.ntime,16)-(Math.floor(new Date()/1000));
    info("Delta: "+delta);
  });
}

var authorized=false;

function handleResponse(res){
  if(authorized && res.id) {
    debug(JSON.stringify(res));
    if(res.result) {
      info("Share Accepted");
    } else if(res.method==notifys.reconnect) {
      host = res.params[0];
      port = res.params[1];
      warn("Reconnecting to new server %s:%s",host,port);
      authorized=false;
      client.destroy();
      connect();
    } else {
      info("Share Rejected");
    }
  } else {
    if(Array.isArray(res.result)) {
      info(JSON.stringify(res.result));
      job.extranonce1=res.result[1];
      job.extranonce2_size=res.result[2];
      client.emit('authorize');
    } else if(res.method==notifys.job) {
      client.emit('job',res.params);
    } else if(res.method==notifys.diff) {
      client.emit('diff',res.params[0]);
    } else if(res.result==true) {
      info("Authorized");
      authorized=true;
    }
  }
};

function formatExtranonce2(extranonce2){
  var size=job.extranonce2_size;
  return ('000000000000000000000000000000'+extranonce2.toString(16)).slice(-2*size);
}



var chunk='';

module.exports = function(pool){
  host = pool.host;
  port = pool.port;
  job.worker_name = pool.worker;
  job.worker_pwd  = pool.pwd;
  connect();

  function getwork() {
    var extranonce2 = job.extranonce2;
    job.extranonce2+=1;
    var coinbase_tx = new Buffer(job.coinb1+job.extranonce1+formatExtranonce2(extranonce2)+job.coinb2,'hex');
    var coinbase_hash = dhash(coinbase_tx);
    var merkle_root_bin = toggle(job.merkle_branch.reduce(function(a,b){return dhash(a.concat(new Buffer(b,'hex')));},coinbase_hash),32);
    var merkle_root = merkle_root_bin.toString('hex');
    job.merkle_to_extranonce2[merkle_root]=[job.job_id,extranonce2];
    var ntime = Math.floor(new Date()/1000+delta).toString(16);
    var data = job.version + job.prevhash + merkle_root + ntime + job.bits + "00000000" + "000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000";
    var midstate = sha256.midstate(data.slice(0,128));
    var work= {"midstate":midstate,"data":data,"hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":job.target};
    info("GetWork");
    debug(JSON.stringify(work));
    return work;
  }


  function submit(data) {
    info("GetWork: "+data);
    var buf = toggle(new Buffer(data,'hex'),32);
    var hash = dhash(buf).reverse();
    var res = ('0000000000000000000000000000000000000000000000000000000000000000'+hash.toString('hex')).slice(-64);
    var target = job.target_orig;
    var pow = res<target;
    debug("  Hash: %s",res);
    debug("Target: %s",target);
    debug("   Pow: %s",pow);
    if(pow) {
      var nonce = data.slice(-8);
      var merkle_root = data.slice(72,136);
      var val = job.merkle_to_extranonce2[merkle_root];
      var job_id = val[0];
      var extranonce2 = val[1];
      var ntime = data.slice(136,144);
      if(extranonce2) {
	stratumSubmit(client,job.worker_name, job_id, formatExtranonce2(extranonce2), ntime, nonce);
      }
    }
    return {'found':pow,'hash':res};
  }

  job.getwork = getwork;
  job.submit = submit;
  
  return job;
};


