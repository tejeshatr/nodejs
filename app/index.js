/*
 *
 * Primary file for the API
 *
 */

// dependencies 
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

// @TODO GET RID OF THIS
helpers.sendTwilioSms('7032455152', 'Hello!', function(err){
	console.log('This was the error:', '"',err,'"');
});

// Creating the HTTP server
var httpServer = http.createServer(function(req, res){
	unifiedServer(req, res)
});

// Start the server and have it listen on port 3000
httpServer.listen(config.httpPort , function(){
	console.log("The server is listening on port " + config.httpPort + " now.");
	console.log("In " + config.envName + " mode\n");
});

// Create the HTTPS server
var httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};

httpsServer = https.createServer(httpsServerOptions, function(req, res){
	unifiedServer(req,res)
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
	console.log('The server is listening on port '+ config.httpsPort + ' now.');
	console.log('In ' + config.envName + ' mode\n');
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res){
	
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
			'payload': helpers.parseJsonToObject(buffer)
		}

		// Route the request to the handler specified in the router
		choosenHandler(data, function(statusCode, payload){
			// Use the status code called back by the handler or default to 200
			statusCode = typeof(statusCode) == 'number'? statusCode : 200;

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
			console.log('Returning this response: ', statusCode, payloadString,'\n');
		});
	});
};

// Define a request router
router = {
	'ping' : handlers.ping,
	'' : handlers.home,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks,
};