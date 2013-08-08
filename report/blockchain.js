var https = require('https');

var root = 'https://blockchain.info';
var param_json = '?format=json';

exports.getblock = function (hash,callback) {
    var url=root+'/block-index/'+hash+param_json;
    https.get(url, function(res) {
	var body = '';
	
	res.on('data', function(chunk) {
            body += chunk;
	});
	
	res.on('end', function() {
	    try {
		var res = JSON.parse(body);
		callback(res);
	    } catch(e) {
	        callback({'notfound':true});
	    }
	});
    }).on('error', function(e) {
	console.log("Got error: ", e);
    });
}

//getblock('000000000000003bbba777203b480e169ff4da727079c3c78d5e6274a826b664');
