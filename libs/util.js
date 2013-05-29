var bignum = require('bignum');

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

  while(decoded>=256) {
    var div = decoded.div(256);
    var mod = decoded.mod(256);
    buf[0]=mod;
    result = Buffer.concat([buf,result]);
    decoded = div;  
  };

  buf[0]=decoded;
  result = Buffer.concat([buf,result]);

  var nPad = 0;
  var addr_split = addr.split("");
  for(var x in addr_split) {
    if(addr_split[x]=='1') {
      nPad += 1;
    } else break;
  };
  
  var pad = new Buffer(nPad);
  pad.fill(0);
  result = Buffer.concat([pad,result]);
  console.log(result);
  var pubkeyhash = result.slice(1,-4);
  var script_begin = new Buffer([0x76,0xa9,0]);
  script_begin[2]=pubkeyhash.length;
  var script_end = new Buffer([0x88,0xac]);
  return Buffer.concat([script_begin,pubkeyhash,script_end]);
};

module.exports.getScriptPubKey = getScriptPubKey;
