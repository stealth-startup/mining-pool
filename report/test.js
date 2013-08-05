var mongoDbConnection = require('./connection');

mongoDbConnection(function(databaseConnection) {
    databaseConnection.collection('blocks')
                      .find({'time':{$gte:1375690741000}})
                      .toArray(function(err,arr){console.log(arr);});
});


