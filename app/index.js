/*
 *
 * Primary file for the API
 *
 */

// dependencies 
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

//The server should respond to all requests with a string
var server = http.createServer(function(req, res){
	
	// Get the URL and parse it
	var parsedUrl = url.parse(req.url, true);

	// Get the path from the URL
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the HTTP method
	var method = req.method.toLowerCase();

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the headers as an object
	var headers = req.headers;

	

	// Get the payload, if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});

	req.on('end', function(){
		buffer += decoder.end();

		// Choose the handler this request should go to. If not found, use 'notFound' handler
		var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': buffer
		}

		// Route the request to the handler specified in the router
		choosenHandler(data, function(statusCode, payload){
			// Use the status code called back by the handler or default to 200
			statusCode = typeof(statusCode) == 'number'? statusCode : 200;
			console.log(payload);

			// Use the payload called back by the handler or use empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString = JSON.stringify(payload);

			//return the response
			res.setHeader('Content-type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			// Log the request path
			console.log('Request received on path: '+trimmedPath);
			console.log('Returning this response: ', statusCode, payloadString);
		})

		// Send the response
			res.end('Hello, world\n');
	});
});

// Start the server and have it listen on port 3000
server.listen(config.port , function(){
	console.log("The server is listening on port " + config.port + " now.");
	console.log("In " + config.envName + " mode");
});

// Define the handlers
var handlers =  {};

// Sample handler
handlers.sample = function(data, callback){
	// Callback a HTTP status code and a payload object
	callback(406, {'name': 'sample handler'});
};

// Home handler
handlers.home = function(data, callback){
	callback(200, {'response': 'Hello, world!'});
};

// Not found handler
handlers.notFound = function(data, callback){
	callback(404);
};

// Define a request router
var router = {
	'sample' : handlers.sample,
	'' : handlers.home
};