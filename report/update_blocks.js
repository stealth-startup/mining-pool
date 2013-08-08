var blockchain = require('./blockchain');

var connection = require('./connection');

var async = require('async');

connection(function(db) {
    db.collection('blocks').find()
	.toArray(function(err,blocks){
	    blocks.forEach(function(block){
		blockchain.getblock(block.hash,function(res) {
		    console.log("Updating %s %s",block.timestamp,block.hash);
		    db.collection('blocks').update({'hash':block.hash},
		 				   {'size':res.size,
		 				    'tx_count':res.n_tx,
		 				    'orphaned':!(res.main_chain),
		 				    'height':res.height
		 				   },
		 				   {upsert:true},function(err,res){console.log(err);});
		});
	    });
	});
});

