var mongoDbConnection = require('./connection');

function f(){
mongoDbConnection(function(databaseConnection) {
    databaseConnection.collection('solo', function(error, collection) {
	collection.insert({'hashrate':14000,'date':+new Date()},{w:1},function(){});
    });
});
    return;
};


f();

console.log('asdfaf');

