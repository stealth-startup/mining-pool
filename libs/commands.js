
var commands = module.exports.commands = [

'addmultisigaddress',
'addnode',
'backupwallet',
'createmultisig',
'createrawtransaction',
'decoderawtransaction',
'dumpprivkey',
'encryptwallet',
'getaccount',
'getaccountaddress',
'getaddednodeinfo',
'getaddressesbyaccount',
'getbalance',
'getauxblock',
'getblock',
'getblockcount',
'getblockhash',
'getblocktemplate',
'getconnectioncount',
'getdifficulty',
'getgenerate',
'gethashespersec',
'getinfo',
'getmininginfo',
'getnewaddress',
'getpeerinfo',
'getrawmempool',
'getrawtransaction',
'getreceivedbyaccount',
'getreceivedbyaddress',
'gettransaction',
'gettxout',
'gettxoutsetinfo',
'getwork',
'help',
'importprivkey',
'keypoolrefill',
'listaddressgroupings',
'listlockunspent',
'listreceivedbyaccount',
'listreceivedbyaddress',
'listsinceblock',
'listtransactions',
'listunspent',
'lockunspent',
'move',
'sendfrom',
'sendmany',
'sendrawtransaction',
'sendtoaddress',
'setaccount',
'setgenerate',
'settxfee',
'signmessage',
'signrawtransaction',
'stop',
'submitblock',
'validateaddress',
'verifymessage'
];

module.exports.isCommand = function(command) {
  command = command.toLowerCase();
  for (var i=0, len=commands.length; i<len; i++) {
    if (commands[i].toLowerCase() === command) {
        return true;
    }
    return false;
  }
};
