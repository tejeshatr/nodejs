/*
 * Handlers
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers')

// Define the handlers
var handlers =  {};

// Users
handlers.users = function(data, callback){
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._users[data.method](data, callback);
	} else
		callback(405);
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
	// check that all required fields are filled out
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false;
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true;


	if(firstName && lastName && phone && password && tosAgreement){
		// Make sure that the user doesn't already exist
		_data.read('users', phone, function(err, data){
			if(err){
				// Hash the password
				var hashedPassword = helpers.hash(password);

				// Create the user object
				if(hashedPassword){
					var userObject = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'password': hashedPassword,
						'tosAgreement': true
					};

					//Store the user
					_data.create('users', phone, userObject, function(err){
						if(!err){
							callback(200);
						}
						else{
							console.log(err);
							callback(500, {'Error': 'Could not create the new user'});
						}
					});
				} else {
					callback(500, {'Error': 'Couldn\'t create hash'});
				}

			} else {
					// User already exists
					callback(400, {'Error': 'A user with that phone number already exists'});
			}
		});
	} else
		callback(400, {'Error': 'Missing required fields'});
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback){
	// Check that the phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone.trim() : false;
	if(phone){
		console.log(data.headers.token);
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify the token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users', phone, function(err, data){
					if(!err && data){
						// Remove the hashed password from the user object before returning it to the requestor
						delete data.password;
						callback(200, data);
					} else{
						callback(404, {'Error': 'User not found'});
					}
				});
			} else
				callback(403, {'Error': 'Missing token or is Invalid'});
		});
	} else{
		console.log(phone);
		callback(400, {'Error': 'Missing required field'});
	}


		
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update other user's data
handlers._users.put = function(data, callback){
	// Check for the required field
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim():false; 

	// Check for the optional fields
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;

	// Error if the phone is invalid
	if(phone){
		// Error if nothing is sent to update
		if(firstName || lastName || password){
			// Get the token from the headers
			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

			// Verify the token is valid for the phone number
			handlers.token.verifyToken(token, phone, function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users', phone, function(err, userData){
					if(!err && userData){
						// Update the fields necessary
						if(firstName)
							userData.firstName = firstName;
						if(lastName)
							userData.lastName = lastName;
						if(password)
							userData.password = helpers.hash(password);

						// Store the new updates
						_data.update('users', phone, userData, function(err){
							if(!err){
								callback(200, {'Success': 'Update fields'})
							} else {
								console.log(err);
								callback(500, {'Error': 'Could not update the user'})
							}
						});
					} else{
					callback(404, {'Error': 'User doesn\'t exist'});
					}
			}); } else
				callback(403, {'Error': 'Missing or Invalid token'});
			});
		} else {
			callback(400, {'Error' : 'Missing fields to update'});
		}
	} else{
		callback(400, {'Error': 'Missing required field'});
	}
};

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their object and not anyone else's
// @TODO Clean up any other data files associated with this user
handlers._users.delete = function(data, callback){
	// Check that the phone number is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify the token is valid for the phone number
		handlers.token.verifyToken(token, phone, function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
			_data.read('users', phone, function(err, data){
				if(!err && data){
					_data.delete('users', phone, function(err){
						if(!err){
							callback(200);
						} else {
							callback(500, {'Error': 'Could not delete the user'});
						}
					});
				} else{
					callback(404, {'Error': 'User not found'});
				}
			});
		} else
			callback(403, {'Error': 'Missing or Invalid token'});
	});
	} else
		callback(400, {'Error': 'Missing required field'});
};

// Tokens
handlers.tokens = function(data, callback){
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._tokens[data.method](data, callback);
	} else
		callback(405);
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data : phone and password
handlers._tokens.post = function(data, callback){
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(phone && password){
		// Lookup the user who matches that phone number

		_data.read('users', phone, function(err, userData){
			if(!err && data){
				// Hash the sent password and compare it to the password stored in the user object
				var hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.password){
					// If valid, create a new token with a random name. Set expiration data 1hr in the future
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000*60*60;
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};

					// Store the token
					_data.create('tokens', tokenId, tokenObject, function(err){
						if(!err){
							callback(200, tokenObject);
						} else
							callback(500, {'Error': 'Could not create a new token'});
					});

				} else 
					callback(400, {'Error': 'Password did not match'});
			} else
				callback(404, {'Error': 'User not found'});
		});
	}
	else
		callback(400, {'Error': 'Missing required fields'});
}

// Tokens - get
// Required data: ID
// Optional data: none
handlers._tokens.get = function(data, callback){
	// Check the ID sent is valid
	console.log(data.queryStringObject.id);
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20? data.queryStringObject.id : false;
	if(id){
		// Lookup the token
		_data.read('tokens', id, function(err, tokenData){
			if(!err && tokenData){
				callback(200, tokenData);
			} else{
				callback(404, {'Error': 'User not found'});
			}
		});
	} else
		callback(400, {'Error': 'Missing required field'});
}

// Tokens - put
// Required fields: id, extend
// Optional data: none
handlers._tokens.put = function(data, callback){
	var id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20? data.payload.id : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend;
	if(id && extend){
		// Look up the token
		_data.read('tokens', id, function(err, tokenData){
			if(!err && tokenData){
				// Check if the token is expired
				if(tokenData.expires > Date.now()){
					// Set the expiration an hour from now
					tokenData.expires = Date.now() + 1000*60*60;

					// Store the new updates
					_data.update('tokens', id, tokenData, function(err){
						if(!err){
							callback(200);
						} else
							callback(500, {'Error': 'Could not update the token'});
					});
				} else{
					callback(400, {'Error': 'Token is already expired'});
				}
			} else
				callback(404, {'Error': 'Token not found'});
		});
	} else
		callback(400, {'Error': 'Missing required field(s) or invalid field(s)'});
}

// Tokens - post
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback){
	// Check that the id is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20? data.queryStringObject.id.trim() : false;
	if(id){
		// Lookup the user
		_data.read('tokens', id, function(err, data){
			if(!err && data){
				_data.delete('tokens', id, function(err){
					if(!err){
						callback(200);
					} else {
						callback(500, {'Error': 'Could not delete the user'});
					}
				});
			} else{
				callback(404, {'Error': 'User not found'});
			}
		});
	} else
		callback(400, {'Error': 'Missing required field'});
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
	// Lookup the token
	_data.read('tokens', id, function(err, tokenData){
		if(!err && tokenData){
			// Check that the token is for the given user and hasn't expired
			if(tokenData.phone == phone && tokenData.expires > Date.now())
				callback(true)
			else
				callback(false);
		} else
			callback(false);
	});
};

// Ping handler
handlers.ping = function(data, callback){
	callback(200);
}

// Home handler
handlers.home = function(data, callback){
	callback(200, {'response': 'Hello, world!'});
};

// Not found handler
handlers.notFound = function(data, callback){
	callback(404);
};


module.exports = handlers;