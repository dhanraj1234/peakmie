#!/usr/bin/env node
var app = require('./app');
var config = require('../config/settings');
var http = require('http');
var NODE_ENV =  process.env.NODE_ENV;
var logger= require('../config/logger');
var db = require('../utils/db');
/**
 * database initilization variables and function with username and password
 */

var dbPath = config.env.development.postgresdb;

if(NODE_ENV == "production")
	dbPath = config.env.production.postgresdb;

console.log("Connecting to db: " + dbPath);
logger.info("Connecting to db: " + dbPath);

db.connectPg(dbPath, function(err, result) {
	if (err != null){
		console.log(err);
		logger.info("Cannot connect to db");
		logger.error("Cannot connect to db");		
		logger.error(err);
	} else {
		console.log("Connected to db");
		logger.info("Connected to db");
	}
});

/**
 * Create HTTP server.
 * Listen on provided port, on all network interfaces.
 */

var server = http.createServer(app);
server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			logger.info(app.get('port') + ' requires elevated privileges')
			logger.error(app.get('port') + ' requires elevated privileges')
			console.error();
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.info(app.get('port') + ' is already in use')
			logger.error(app.get('port') + ' is already in use')
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	console.log('Listening on ' + bind + '...');
	logger.info('Listening on ' + bind + '...');
}