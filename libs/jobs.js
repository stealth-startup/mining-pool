// # 1. Increase extranonce2
// # 2. Build final extranonce
// # 3. Put coinbase transaction together
// # 4. Calculate coinbase hash
// # 5. Calculate merkle root
// # 6. Generate current ntime
// # 7. Serialize header
// # 8. calculate midstate 
// # 9. header, midstate, target = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000', hash1= "00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000"

var async = require('async');

var util = require('./util');

var buffertools = require('buffertools');

var bitcoind = require('./kapitalize')({
  user:'naituida',
  pass:'123',
  host:'localhost',
  port:8080
});

var namecoind = require('./kapitalize')({
  user:'naituida',
  pass:'123',
  host:'localhost',
  port:8081
});


var crypto = require('crypto');
var dhash = function(x) {return crypto.createHash('sha256').update(crypto.createHash('sha256').update(x).digest()).digest();};

var sha256 = new (require('./sha256')).Sha256();                         

require('buffertools');
var toggle = require('endian-toggle');

var coinbaser=require('./coinbase');

function Jobs () {
  this.b_version = new Buffer("00000002",'hex');
  this.b_padding = "00000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000";
  // this.addr = '13J6Mg58DBfx2aDZvFg76kjGUmYByuriry';
  // this.addr = 'mtLsXbpDWNQDakQAtPjEN27qmgwYATkVEH';
  // this.addr = 'mraCxCcYM3E1HTvGcTmxY2gzNm9fKfdbN8';
  this.addr = '1HtUGfbDcMzTeHWx2Dbgnhc6kYnj1Hp24i';
  this.extranonce = 0;
  this.merkle_branch = [];
  this.height = 0;
  this.amount = 0;
  this.nbits = "";
  this.prevhash = "";
  this.coinbase_tx = new Buffer(0);
  this.txs = [];
  this.merkle_to_coinbase = {};
  this.template_1="";
  this.template_2="";
  this.merkle_root = "";
  this.target = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000';
  this.hash1 = "00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000";

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
	  // console.log(inputs);
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
    bitcoind.getblocktemplate(
      function(err,res) {
	async.waterfall(
	  [
	    function(callback) {
	      self.merkle_to_coinbase = {};
	      callback(null);
	    },
	    function(callback) {
	      // console.log("parsing block template");
	      self.extranonce = 0;
	      self.height = res.height;
	      self.target = res.target;
	      // self.target = '00000000FFFF0000000000000000000000000000000000000000000000000000';
	      self.amount = res.coinbasevalue;
	      self.nbits = res.bits;
	      self.txs = res.transactions;
	      self.prevhash = res.previousblockhash;
	      self.update_merkle_branch(self.txs);
	      callback(null);
	    } ,

	    function(callback) {
	      // console.log("build prev hash");
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
	      console.log("Block Template Updated");
	      // console.log(self);
	      console.log(self.txs.length);
	      callback(null);
	    }
	  ]);
      }
    );
  },

  update_namecoin_block: function() {
    console.log("updating namecoin");
    var self = this;
    namecoind.getauxblock(function(err,aux_pow) {
      self.namecoin_target = self.reverse_hex(aux_pow.target);
      self.namecoin_hash = aux_pow.hash;
      self.merged_script = new Buffer('fabe6d6d'+aux_pow.hash+'01000000'+'00000000','hex');
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
	  // console.log("building coinbase");
	  // console.log(self.addr + self.amount + self.height);
	  self.coinbase_tx = coinbaser.build_tx(self.addr,self.amount,self.height,self.increase_extranonce(),self.merged_script);
	  coinbase_hash = dhash(self.coinbase_tx); 
	  callback(null,coinbase_hash);
	},
	
	two:function(callback) {
	  // console.log("coinbase:%s",self.coinbase_tx.toString('hex'));
	  // console.log("coinbase_hash:%s",coinbase_hash.toString('hex'));
	  self.merkle_root = self.get_merkle_root(coinbase_hash);
	  self.merkle_to_coinbase[self.merkle_root]=self.coinbase_tx.toString('hex');
	  callback(null,self.merkle_root);
	},
	
	three:function(callback) {
	  // console.log("merkle branch:");
	  // self.merkle_branch.forEach(function(x){console.log(x.toString('hex'));});
	  // console.log("merkle root:%s",self.merkle_root);
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
    // console.log(work);
    return JSON.stringify(work);
  },


  submit : function(data) {
    var self = this;

    var buf = toggle(new Buffer(data,'hex'),32);
    var block_header = buf.toString('hex');

    var hash = dhash(buf).reverse();
    var res = ('0000000000000000000000000000000000000000000000000000000000000000'+hash.toString('hex')).slice(-64);
    var target = this.target;
    var namecoin_target = this.namecoin_target;
    var pow = res<target;
    var aux_pow = res<namecoin_target;
    // var aux_pow = true;

    var merkle = data.slice(72,136);
    var coinbase = this.merkle_to_coinbase[merkle];
    var staled = (coinbase === undefined);

    console.log("bitcoin  result:%s\nbitcoin  target:%s\nfound:%s\n",res,target,pow);
    console.log("namecoin result:%s\nnamecoin target:%s\nfound:%s\n",res,namecoin_target,aux_pow);

    
    if(aux_pow && !staled) {
      // We found a namecoin block
      // coinbase + bitcoin block hash + branch_count + merkle_branches + branch index(0x00000000) + aux branch count(0x00) + aux branch index(0x00000000) + bicoin blockheader
      var branch_count;
      var branch_hex;
      var parent_header=block_header;
      var parent_hash=self.reverse_hex(res);
      async.waterfall(
	[
	  function(callback) {
	    branch_count = util.toVarIntHex(self.merkle_branch.length);
	    callback(null);
	  },
	  
	  function(callback) {
	    async.reduce(self.merkle_branch,"",function(cur,item,cb){
	      cb(null,cur+item.toString('hex'));
	    }, function(err, result){
	      branch_hex = result;
	    });
	    callback(null);
	  },

	  function(callback) {
	    var namecoin_submission = 
		  coinbase + parent_hash + branch_count + branch_hex + "000000000000000000" + parent_header;
	    console.log("namecoin hash:%s\n",self.namecoin_hash);
	    console.log("namecoin  aux:%s\n",namecoin_submission);
	    namecoind.getauxblock(self.namecoin_hash,namecoin_submission,
				  function(err,res){
				     console.log("Coinbase:%s",coinbase);
				     console.log("Block Hash:%s",parent_hash);
				     console.log("Parent Header:%s",parent_header);
				     console.log("Error:%s",err);
				     console.log("Result:%s",JSON.stringify(res));
				  });
	    callback(null);
	  }
	]);
    };


    if(pow && !staled) {
      // LMFAO!!!! We found a block!!!!
      // Let's build it!!!

      var b_count;
      var count_hex;
      var tx_hex;
      async.waterfall(
	[
	  function(callback) {
	    // console.log(self);
	    var count = self.txs.length+1;
	    // console.log("Tx count %s:",count);
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
	    console.log("submitblock:%s",raw_block);
	    bitcoind.submitblock(raw_block,
				   function(err,res){
				     // console.log("Error:%s",err);
				     // console.log("Result:%s",JSON.stringify(res));
				   }
				  );
	    callback(null);
	  },

	  function(callback) {
	    // self.update_block();
	    callback(null);
	  }
	]);      
    }
    return {'found':pow,'staled':staled,'hash':res};
  }
};


module.exports = Jobs;
