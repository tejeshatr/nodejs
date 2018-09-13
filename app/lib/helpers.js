/*
 * Helpers for various tasks
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');


// Container for all the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str){
	if(typeof(str) == 'string' && str.length > 0){
		var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
		return hash;
	}
	else 
		return false;
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function(str){
	if(str !== ''){
		try{
			var obj = JSON.parse(str);
			return obj;
		} catch(e) {
			console.log(e);
			return {};
		}
	}
	return {};
}

// Create a string of random alphanumeric chars, of a given length
helpers.createRandomString = function(strLength){
	strLength = typeof(strLength) == 'number' && strLength > 0? strLength : 0;
	if(strLength){
		var possibleChars = 'abcdefijklmnopqrstuvwxyz0123456789';

		var str =  '';
		for(let i = 0; i < strLength; i++){
			str += possibleChars[Math.floor(Math.random()*possibleChars.length)];
		}
		
		return str;
	}
}


// Export the module
module.exports = helpers;