var winston= require('winston');
require('winston-daily-rotate-file');
var fs= require('fs');
var logDirectory = './internal_logs';

winston.setLevels(winston.config.npm.levels);
winston.addColors(winston.config.npm.colors);

if (!fs.existsSync(logDirectory)) {
	// Create the directory if it does not exist
	fs.mkdirSync(logDirectory);
}

let logger = new (winston.Logger)({
	transports: [
		new winston.transports.DailyRotateFile({
			name: 'debug-file',
			level: 'debug',
			timestamp: function () { return Date() },
			filename: logDirectory + '/debug-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			handleExceptions: true,
			json: true,
		}),
		new winston.transports.DailyRotateFile({
			name: 'error-file',
			level: 'error',
			timestamp: function () { return Date() },
			filename: logDirectory + '/error-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			handleExceptions: true,
			json: true
		}),
		new winston.transports.DailyRotateFile({
			name: 'info-file',
			level: 'info',
			timestamp: function () { return Date() },
			filename: logDirectory + '/info-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			handleExceptions: true,
			json: true
		})
	],
	exitOnError: false
});

module.exports = logger;
