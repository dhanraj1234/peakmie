/******************** Node imports ***********************/
var bodyParser= require('body-parser');
var cookieParser= require('cookie-parser');
var express= require('express');
var favicon= require('serve-favicon');
var flash= require('connect-flash');
var fs= require('fs');
var methodOverride= require('method-override');
var morgan= require('morgan');
var passport= require('passport');
var path= require('path');
var cookieSession = require('cookie-session');

/******************* Local imports ***********************/
var logger= require('../config/logger');
var users= require('../routes/users');
var settings= require('../config/settings');

/************************* Setup Application Server *********************************/
var app = express();
var env = app.get('env') || 'development';
var envConfig;

if(env === 'production') {
	logger.info('=========	Running in PRODUCTION mode =========')
	envConfig = settings.env.production;
} else {
	logger.info('=========	Running in DEVELOPMENT mode =========');
	envConfig = settings.env.development;
}


// setup port
app.set('port', envConfig.port);

// create log folders if it does not exist
if (!fs.existsSync(envConfig.logDirectory)) {
	fs.mkdirSync(envConfig.logDirectory);
}

// setup morgan for application level logging
let accessLogStream = fs.createWriteStream(envConfig.logDirectory + "/" + envConfig.accessLogFile, {
	flags: 'a'
});
let errorLogStream = fs.createWriteStream(envConfig.logDirectory + "/" + envConfig.errorLogFile, {
	flags: 'a'
});
morgan.format(
	'custom-format',
	':date[iso] :response-time ms :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
let theAccessLog = morgan('custom-format', {
	skip: function (req, res) {
		return res.statusCode >= 400
	},
	stream: accessLogStream
});
let theErrorLog = morgan('custom-format', {
	skip: function (req, res) {
		return res.statusCode < 400
	},
	stream: errorLogStream
});
app.use(theAccessLog);
app.use(theErrorLog);

// setup session
app.use(cookieSession({
	name: envConfig.sessionName,
	keys: [envConfig.secret],
	secure: envConfig.secure,	
	// Cookie Options
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
  
// setup response for OPTIONS hit
app.use((req, res, next) => {
	if (req.method === 'OPTIONS') {
		return res.status(200).send();
	} else {
		next();
	}
});

// setup parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// setup extras
app.disable('x-powered-by');
app.use(methodOverride('X-HTTP-Method')) // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')) // Google/GData
app.use(methodOverride('X-Method-Override')) // IBM
app.use(flash());


// setup routes
app.use('/', users);


// setup path not found error handler
app.use((req, res, next) => {
	if (req.resourcePath) {
		return next()
	} else {
		res.status(404);
		return res.json({
			status: false,
			"message": `The path ${req.path} is not found`
		});
	}
});

// setup internal server error handler
app.use((err, req, res, next) => {
	if (err) {
		logger.error("Error checker server", err);
		let _err;
		if (env === 'development') {
			_err = "ERROR: Validation failed. ";
		} else {
			_err = 'Internal Error'
		}
		res.status(400);
		return res.json({
			status: false,
			"message": _err
		});
	} else {
		return next();
	}
});

module.exports = app;