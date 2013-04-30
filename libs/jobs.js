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

var kapitalize = require('./kapitalize')({
    user:'naituida',
    pass:'123',
    host:'localhost',
    port:8080
  });

var crypto = require('crypto');
var dhash = function(x) {return crypto.createHash('sha256').update(crypto.createHash('sha256').update(x).digest()).digest();};

var sha256 = new (require('./sha256')).Sha256();                         

require('buffertools');
var toggle = require('endian-toggle');

var coinbase=require('./coinbase');

function Jobs () {
  this.b_version = new Buffer("00000002",'hex');
  this.b_nonce = new Buffer("00000000",'hex');
  this.b_padding = "00000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000";
  // this.addr = '13J6Mg58DBfx2aDZvFg76kjGUmYByuriry';
  this.addr = 'mtLsXbpDWNQDakQAtPjEN27qmgwYATkVEH';

  this.extranonce = 0;
  this.merkle_branch = [];
  this.height = 0;
  this.amount = 0;
  this.nbits = new Buffer(4);
  this.prevhash = "";
  
  this.template_1="";
  this.template_2="";
  this.merkle_root = "";
  this.target = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000';
  this.hash1 = "00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000";

};

Jobs.prototype = {
  get_merkle_root : function(coinbase) {
    var coinbase_hash = dhash(coinbase);  
    var buf = this.merkle_branch.reduce(function(a,b){return dhash(Buffer.concat([a,b]));},coinbase_hash);
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

  update_merkle_branch : function() {
    var inputs = this.txs.map(
      function(x){
	var buf=new Buffer(x.hash,'hex');
	return buf.reverse();
      });
    
    inputs.unshift(inputs[0]);
    var len = inputs.length;
    this.merkle_branch = [];

    while(len>1) {
      this.merkle_branch.push(inputs[1]);
      if(len%2==1) inputs.push(inputs.slice(-1)[0]);
      var new_inputs = [];
      for(var i=0;i<len;i=i+2) {
	new_inputs.push(dhash(Buffer.concat([inputs[i],inputs[i+1]])));
      }
      inputs=new_inputs;
      len=inputs.length;
    };
    return this.merkle_branch;
  },
  
  update_block : function() {
    var self = this;
    kapitalize.getblocktemplate(
      function(err,res) {
	self.extranonce = 0;
	self.height = res.height;
	self.amount = res.coinbasevalue;
	self.nbits = res.bits;
	self.txs = res.transactions;
	self.prevhash = res.previousblockhash;
	self.update_merkle_branch();
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


	// async.series([
	//   function(callback) {
	//     self.update_merkle_branch();
	//   },
	//   function(callback) {
	//     var buf = new Buffer(self.prevhash,'hex');
	//     var new_buf = new Buffer(32);
	//     new_buf.fill(0);
	//     buf.copy(new_buf, 28,  0,  4);
	//     buf.copy(new_buf, 24,  4,  8);
	//     buf.copy(new_buf, 20,  8, 12);
	//     buf.copy(new_buf, 16, 12, 16);
	//     buf.copy(new_buf, 12, 16, 20);
	//     buf.copy(new_buf,  8, 20, 24);
	//     buf.copy(new_buf,  4, 24, 28);
	//     buf.copy(new_buf,  0, 28, 32);
	//     self.template_1 = Buffer.concat([self.b_version,new_buf]).toString('hex');
	//     self.template_2 = self.nbits + self.b_padding;
	//   }
	// ]);
      }
    );
  },

  increase_extranonce : function(f) {
    this.extranonce = this.extranonce + 1;
    return this.extranonce;
  },

  getwork : function() {
    var self = this;
    var work;
    async.series({

      merkle_root:function(callback) {
	var coinbase_tx = coinbase.build_tx(self.addr,self.amount,self.height,self.increase_extranonce());
	self.merkle_root = self.get_merkle_root(coinbase_tx);
	callback(null,self.merkle_root);
      },
      
      data:function(callback) {
	var cur_time = Math.round(+new Date()/1000).toString(16);
	var cur_data = self.template_1 + self.merkle_root + cur_time + self.template_2;
	callback(null,cur_data);
      }
      
    }, 
		 function(err,result) {
		   var midstate = sha256.midstate(result.data.slice(0,128));
		   work= {"midstate":midstate,"data":result.data,"hash1":self.hash1,"target":self.target};
    });
    return work;
  },


  submit : function() {
    

  }
};


module.exports = Jobs;
