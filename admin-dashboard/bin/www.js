var fs= require('fs');

/**
 * Module dependencies.
 */

var app = require('./app');
var config = require('../config/settings');
var http = require('http');

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
			process.exit(1);
			break;
		case 'EADDRINUSE':
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
}
