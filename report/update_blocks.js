var blockchain = require('./blockchain');

var connection = require('./connection');

var async = require('async');

connection(function(db) {
  db.collection('blocks').find()
    .toArray(function(err,blocks){
      blocks.forEach(function(block){
	blockchain.getblock(block.hash,function(res) {
          if(!res.notfound) {
	    console.log("Updating %s %s",new Date(block.time),block.hash);
	    db.collection('blocks').update({'hash':block.hash},{$set:{
              'size':res.size,
              'fee':(parseInt(res.fee)/100000000.0).toFixed(8),
	      'tx_count':res.n_tx,
	      'orphaned':!(res.main_chain),
	      'height':res.height
	    }},{},function(err,res){console.log(err);});
          } 
	});
      });
    });

});

