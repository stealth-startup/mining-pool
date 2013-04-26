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
