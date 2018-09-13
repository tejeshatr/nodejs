/*
 * Create and export config variables
 */

// Container for all the environments
var environments = {};

// Staging {default} environment
environments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'envName': 'staging',
	'hashingSecret': 'thisIsASecret',
	'maxChecks': 5
};

//Production environment
environments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'envName': 'production',
	'hashingSecret': 'thisIsAlsoASecret',
	'maxChecks': 5
};

// Determine which env is passed as CL argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase() : '';

// Check if the env is one of the defined ones
var environmentToExport = typeof(environments[currentEnvironment]) == 'object'? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;  