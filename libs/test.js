// midstate

var sha256 = new (require('./sha256')).Sha256();

var str='0000000293d5a732e749dbb3ea84318bd0219240a2e2945046015880000003f5000000008d8e2673e5a071a2c83c86e28033b1a0a4aac90dde7a0670827cd0c3';

console.time("calculate midstate 10000 times");

for(var i=0;i<10000;i++) {
  sha256.midstate(str);  
}

console.timeEnd("calculate midstate 10000 times");


// kapitalize
var kapitalize = require('./kapitalize')({
    user:'naituida',
    pass:'123',
    host:'127.0.0.1',
    port:8080
});

// list num of transactions to include in next block
kapitalize.getblocktemplate(function(err,res){console.log("%d transactions to write",res.transactions.length);});

var crypto = require('crypto');
var dhash = function(x) {return crypto.createHash('sha256').update(crypto.createHash('sha256').update(x).digest()).digest();};

require('buffertools');
var toggle = require('endian-toggle');

var txs;
var merkle_root;
var my_root;
var coinbase;
var steps;

kapitalize.getblockhash(231769,
			function(err,bhash) {
			  kapitalize.getblock(bhash,
					      function(err,block) { 
						merkle_root=block.merkleroot;
						txs=block.tx;
						var inputs = txs.map(
						  function(x){
						    var buf=new Buffer(x,'hex');
						    return buf.reverse();
						  });
						
						var len = inputs.length;
						steps = [];
						coinbase=inputs[0];

						while(len>1) {
						  steps.push(inputs[1]);
						  if(len%2==1) inputs.push(inputs.slice(-1)[0]);
						  var new_inputs = [];
						  for(i=0;i<len;i=i+2) {
						    new_inputs.push(dhash(Buffer.concat([inputs[i],inputs[i+1]])));
						  }
						  inputs=new_inputs;
						  len=inputs.length;
						};
						my_root = inputs[0].reverse().toString('hex');
						var my_root2=steps.reduce(function(a,b){return dhash(Buffer.concat([a,b]));},coinbase).reverse().toString('hex');
						console.log("expected root:%s",merkle_root);
						console.log("     our root:%s",my_root);
						console.log("  from branch:%s",my_root2);
});});




// base58
var bignum = require('bignum');

var addr = '14cZMQk89mRYQkDEj8Rn25AnGoBi5H6uer';
var alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var baseCount = bignum(58);

var b58decode = function(s) {
  var decoded = bignum(0),
      multi = bignum(1),
      reversed = s.split("").reverse().join("");
  for (var i = 0, max = reversed.length; i < max; i++) {
    decoded=decoded.add(multi.mul(bignum(alphabet.indexOf(reversed[i]))));
    multi=multi.mul(baseCount);
  }
  return decoded;
};

var getScriptPubKey = function (addr) {
  var decoded = b58decode(addr);

  var result = new Buffer(0);
  var buf = new Buffer(1);

  while(decoded>256) {
    var div = decoded.div(256);
    var mod = decoded.mod(256);
    buf[0]=mod;
    result = Buffer.concat([buf,result]);
    decoded = div;  
  };

  buf[0]=decoded;
  result = Buffer.concat([buf,result]);

  var pubkeyhash = result.slice(0,-4);
  var script_begin = new Buffer([0x76,0xa9,0]);
  script_begin[2]=pubkeyhash.length;
  var script_end = new Buffer([0x88,0xac]);
  return Buffer.concat([script_begin,pubkeyhash,script_end]);
};
console.log("scriptPubKey Hash of %s",addr);
console.log(getScriptPubKey(addr).toString('hex'));

// build coinbase transaction
var t_version = new Buffer(4);
t_version.writeUInt32LE(1,0);

var t_vin_count = new Buffer(1);
t_vin_count[0]=1;

var t_padding= new Buffer(36);
t_padding.fill(0,0,32);
t_padding.fill(0xff,32,36);

var coinbase_begin = new Buffer(5);
kapitalize.getblockcount(function(err,count){
  var height = count+1;
  coinbase_begin.writeUInt32LE(height,1);
  coinbase_begin[0]=3;
  coinbase_begin=coinbase_begin.slice(0,-1);
});

var coinbase_msg = new Buffer("Mined By Avalon");


var coinbase_extra_nonce = new Buffer(4);
coinbase_extra_nonce.fill(0);


var t_sequence = new Buffer(4);
t_sequence.fill(0xff);

var t_vout_count = new Buffer(1);
t_vout_count[0]=1;


var amount = 2518695000;
var t_amount = new Buffer(4);
t_amount.writeUInt32LE(amount,0);

var t_padding2 = new Buffer(4);
t_padding2.fill(0);

var t_locktime = new Buffer(4);
t_locktime.fill(0);

var build_coinbase_tx = function(addr) {
  var coinbase = Buffer.concat([coinbase_begin,coinbase_msg,coinbase_extra_nonce]);
  var coinbase_len = new Buffer(1);
  coinbase_len[0] =  coinbase.length;
  var t_pubkey = getScriptPubKey(addr);
  var t_script_len = new Buffer(1);
  t_script_len[0]=t_pubkey.length;
  var coinbase_tx = Buffer.concat([t_version,t_vin_count,t_padding,coinbase_len,coinbase,t_sequence,t_vout_count,t_amount,t_padding2,t_script_len,t_pubkey,t_locktime]);
  return coinbase_tx;
};

// var raw = 
//       // version
//       '01000000' 
//       // in-counter
//       + '01' 
//       // 32 bytes 0 and ffffffff
//       + '0000000000000000000000000000000000000000000000000000000000000000ffffffff'
//       // coinbase length
//       + '25' 
//       // coinbase
//          + '03' 		// length of height
//          + 'df8e03'   		// height
//          + '040000519612' 
//          + '4d696e656420627920425443204775696c64' // Mined by BTC Guild
//          + '0800fb1fda5d000000' 
//       // sequence 
//       + 'ffffffff' 
//       // out-counter 
//       + '01' 
//       // amount
//       + '48930597' 
//       padding?
//       + '00000000'
//       // script length
//       + '19' 
//       // scriptPubKey
//       + '76a91427a1f12771de5cc3b73941664b2537c15316be4388ac' 
//       // locktime
//       + '00000000';

var block_header_for_getwork = 
      // version
      '00000002' + 
      // prev hash
    // 0000000000000024be126a8586a0115cf34d42587f1e94eb26819c16d5e52db5
      'd5e52db526819c167f1e94ebf34d425886a0115cbe126a850000002400000000' + 
       // merkle root
      'ae1b0cd6a5c82757a173719452b422a4f55f5d92fbca57e75ef34b5a10371633' + 
      // timestamp
      '517c774a' + 
      // nbits
      '1a01de94' + 
      // nonce and padding
      '00000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000';


