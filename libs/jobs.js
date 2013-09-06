var async = require('async');

var config = require('../config.json');

var util = require('./util');

var buffertools = require('buffertools');

var pubkey = util.getScriptPubKey(config.solo_addr);
var msg = config.coinbase_msg;

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

require('buffertools');
var toggle = require('endian-toggle');

var coinbaser=require('./coinbase');

function Jobs (bitcoind) {
  this.b_version = new Buffer("00000002",'hex');
  this.b_padding = "00000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000";
  this.addr = config.solo_addr;
  this.extranonce = 0;
  this.merkle_branch = [];
  this.height = 0;
  this.amount = 0;
  this.is_native = is_native;
  this.nbits = "";
  this.prevhash = "";
  this.coinbase_tx = new Buffer(0);
  this.txs = [];
  this.merkle_to_coinbase = {};
  this.template_1="";
  this.template_2="";
  this.merkle_root = "";
  this.target = '00000000000000ffffffffffffffffffffffffffffffffffffffffffffffffff';
  this.hash1 = "00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000";
  this.bitcoind = bitcoind;
};

Jobs.prototype = {
  get_merkle_root : function(coinbase_hash) {
    var buf = this.merkle_branch.reduce(function(a,b){return dhash(a.concat(b));},coinbase_hash).reverse();
    var new_buf = new Buffer(32);
    new_buf.fill(0);
    buf.copy(new_buf, 28,  0,  4);
    buf.copy(new_buf, 24,  4,  8);
    buf.copy(new_buf, 20,  8, 12);
    buf.copy(new_buf, 16, 12, 16);
    buf.copy(new_buf, 12, 16, 20);
    buf.copy(new_buf,  8, 20, 24);
    buf.copy(new_buf,  4, 24, 28);
    buf.copy(new_buf,  0, 28, 32);
    
    return new_buf.toString('hex');
  },

  update_merkle_branch : function(txs) {
    var self = this;
    async.waterfall(
      [
	function(callback) {
	  var inputs = txs.map(
	    function(x){
	      var buf=new Buffer(x.hash,'hex');
	      return buf.reverse();
	    });
	  callback(null,inputs);
	},

	function(inputs,callback) {
	  inputs.unshift(new Buffer(0));
	  var len = inputs.length;
	  self.merkle_branch = [];
	  while(len>1) {
	    self.merkle_branch.push(inputs[1]);
	    if(len%2==1) inputs.push(inputs.slice(-1)[0]);
	    var new_inputs = [];
	    for(var i=0;i<len;i=i+2) {
	      new_inputs.push(dhash(Buffer.concat([inputs[i],inputs[i+1]])));
	    }
	    inputs=new_inputs;
	    len=inputs.length;
	  };
	  callback(null);
	}]);
    return self.merkle_branch;
  },
  
  update_block : function() {
    var self = this;
    self.bitcoind.getblocktemplate(
      function(err,res) {
	if(!err) {
	  async.waterfall(
	    [
	      function(callback) {
		self.merkle_to_coinbase = {};
		callback(null);
	      },
	      function(callback) {
		self.extranonce = 0;
		self.height = res.height;
		self.target = res.target;
		self.amount = res.coinbasevalue;
		self.nbits = res.bits;
		self.txs = res.transactions;
		self.prevhash = res.previousblockhash;
		self.update_merkle_branch(self.txs);
		callback(null);
	      } ,
	      
	      function(callback) {
		var buf = new Buffer(self.prevhash,'hex');
		var new_buf = new Buffer(32);
		new_buf.fill(0);
		buf.copy(new_buf, 28,  0,  4);
		buf.copy(new_buf, 24,  4,  8);
		buf.copy(new_buf, 20,  8, 12);
		buf.copy(new_buf, 16, 12, 16);
		buf.copy(new_buf, 12, 16, 20);
		buf.copy(new_buf,  8, 20, 24);
		buf.copy(new_buf,  4, 24, 28);
		buf.copy(new_buf,  0, 28, 32);
		self.template_1 = Buffer.concat([self.b_version,new_buf]).toString('hex');
		self.template_2 = self.nbits + self.b_padding;
		callback(null);
	      },

	      function(callback) {
		console.log("[%s]BitCoind Block Template Updated",new Date());
		console.log("Total Transactions in Template:%s",self.txs.length);
		callback(null);
	      }
	    ]);
	} else {
	  console.log("bitcoin.conf error or bitcoind is downloading blocks, try 'bitcoind getblocktemplate' in command-line");
	  process.exit(1);
	}			
      });
  },

  increase_extranonce : function(f) {
    this.extranonce = this.extranonce + 1;
    return this.extranonce;
  },
  
  reverse_hex: function(str) {
    var buf = new Buffer(str,'hex');
    return buf.reverse().toString('hex');
  },

  getwork : function() {
    var self = this;
    var work;
    var data;
    var target;
    var coinbase_hash;
    async.series(
      {
	one:function(callback) {
	  self.coinbase_tx = coinbaser.build_tx(self.addr,self.amount,self.height,self.increase_extranonce(),pubkey,new Buffer(msg));
	  coinbase_hash = dhash(self.coinbase_tx); 
	  callback(null,coinbase_hash);
	},
	
	two:function(callback) {
	  self.merkle_root = self.get_merkle_root(coinbase_hash);
	  self.merkle_to_coinbase[self.merkle_root]=self.coinbase_tx.toString('hex');
	  callback(null,self.merkle_root);
	},
	
	three:function(callback) {
	  var cur_time = Math.round(+new Date()/1000).toString(16);
	  data = self.template_1 + self.merkle_root + cur_time + self.template_2;
	  callback(null,data);
	},
	
	four:function(callback) {
	  target = self.reverse_hex(self.target);
	  callback(null,target);
	},

	response:function(callback) {
	  var midstate = sha256.midstate(data.slice(0,128));
	  work= {"midstate":midstate,"data":data,"hash1":self.hash1,"target":target,"padding":"dannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoingdannywtfRUdoing"};
	  callback(null,JSON.stringify(work));
	}
      }
    );
    return JSON.stringify(work);
  },


  submit : function(data) {
    var self = this;

    var buf = toggle(new Buffer(data,'hex'),32);
    var block_header = buf.toString('hex');

    var hash = dhash(buf).reverse();
    var res = ('0000000000000000000000000000000000000000000000000000000000000000'+hash.toString('hex')).slice(-64);
    var target = this.target;

    var pow = res<target;
    if(pow) {
     console.log("bitcoin  result:%s\nbitcoin  target:%s\nfound:%s\n",res,target,pow);
    }

    var merkle = data.slice(72,136);
    var coinbase = this.merkle_to_coinbase[merkle];

    if(pow) {
      // LMFAO!!!! We found a block!!!!
      // Let's build it!!!

      var b_count;
      var count_hex;
      var tx_hex;
      async.waterfall(
	[
	  function(callback) {
	    var count = self.txs.length+1;
	    count_hex = util.toVarIntHex(count);
	    callback(null);
	  } ,

	  function(callback) {
	    async.reduce(self.txs,coinbase,function(cur,item,cb){
			   cb(null,cur+item.data);
			 }, function(err, result){
			   tx_hex = result;
			 });
	    callback(null);			 
	  } ,


	  function(callback) {
	    var raw_block = block_header + count_hex + tx_hex;
	    console.log("[%s]BitCoin submitblock:%s",new Date(),raw_block);
	    console.log("[%s]BitCoin submitblock:%s",new Date(),'https://blockchain.info/block-index/'+res);
	    self.bitcoind.submitblock(raw_block,
				 function(err,res){
				   console.log("Error:%s",err);
				   console.log("Result:%s",JSON.stringify(res));
				 }
				);
	    callback(null);
	  }
	]);      
    }
    return {'found':pow,'hash':res};
  }
};


module.exports = Jobs;
