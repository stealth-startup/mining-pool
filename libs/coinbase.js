var util = require('./util');

var t_version = new Buffer(4);
t_version.writeUInt32LE(1,0);

var t_vin_count = new Buffer(1);
t_vin_count[0]=1;

var t_padding= new Buffer(36);
t_padding.fill(0,0,32);
t_padding.fill(0xff,32,36);


var coinbase_msg = new Buffer("Mined By Avalon");

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

var build_coinbase_tx = function(addr,height,extranonce) {

  var coinbase_begin = new Buffer(5);
  coinbase_begin.writeUInt32LE(height,1);
  coinbase_begin[0]=3;
  coinbase_begin=coinbase_begin.slice(0,-1);
 
  var coinbase_extra_nonce = new Buffer(4);
  coinbase_extra_nonce.fill(extranonce);

  var coinbase = Buffer.concat([coinbase_begin,coinbase_msg,coinbase_extra_nonce]);
  
  var coinbase_len = new Buffer(1);
  coinbase_len[0] =  coinbase.length;
  
  var t_pubkey = util.getScriptPubKey(addr);

  var t_script_len = new Buffer(1);
  t_script_len[0]=t_pubkey.length;

  var coinbase_tx = Buffer.concat([t_version,t_vin_count,t_padding,coinbase_len,coinbase,t_sequence,t_vout_count,t_amount,t_padding2,t_script_len,t_pubkey,t_locktime]);

  return coinbase_tx;
};

module.exports.build_tx = build_coinbase_tx;
