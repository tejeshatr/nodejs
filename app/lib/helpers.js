/*
 * Helpers for various tasks
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

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


// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
	// Validate params
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
	msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	if(phone && msg){
		// Configure the request payload 
		var payload = {
			'From': config.twilio.fromPhone,
			'To': '+91'+phone,
			'Body': msg
		};

		// Stringify the payload
		var stringPayload = querystring.stringify(payload);

		// Configure the request details
		var requestDetails = {
			'protocol': 'https:',
			'hostname': 'api.twilio.com',
			'method': 'POST',
			'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
			'auth': config.twilio.accountSid+':'+config.twilio.authToken,
			'headers': {
				'Content-Type': 'application/x-ww-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		};

		// Instantiate the request object
		var req = https.request(requestDetails, function(res){
			// Grab the status of the sent request
			var status = res.statusCode;
			// Callback successfully if the request went through
			if(status == 200 || status == 201)
				callback(false);
			else
				callback('Status code returned was '+status);
		});

		// Bind the error event so it doesn't get thrown
		req.on('error', function(e){
			callback(e);
		});

		// Add the payload
		req.write(stringPayload);

		// End the request
		req.end();
	} else
		callback('Given params are missing or invalid');
};

// Export the module
module.exports = helpers;