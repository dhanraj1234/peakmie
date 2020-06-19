/******************** Node imports ***********************/
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon =  require('serve-favicon');
var flash = require('connect-flash');
var fs = require('fs');
var methodOverride = require('method-override');
var passport = require('passport');
var path = require('path');

/******************* Local imports ***********************/
var routes = require('../routes/index');
var ajax = require('../routes/ajax');
var settings = require('../config/settings');
var setupPassport = require('../config/passport');

/************************* Setup Application Server *********************************/
var app = express();
var env = app.get('env') || 'development';
var envConfig;

if(env === 'production') {
	envConfig = settings.env.production;
} else {
	envConfig = settings.env.development;
}

// view engine setup
app.set('views', path.join('./views'));
app.set('view engine', 'ejs');

// setup favicon form application
app.use(favicon(path.join('./public', 'favicon.ico')));

// setup port
app.set('port', envConfig.port);

// setup session
app.use(cookieSession({
	name: envConfig.sessionName,
	keys: [envConfig.secret],
	secure: envConfig.secure,	
	// Cookie Options
	maxAge: 3600000 
}));

// if production, set additional headers
if (env === 'production') {
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "https://peakmie.mobile.io");
		res.header("Access-Control-Allow-Credentials", "true");
		res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, x-xsrf-token");
		res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
	});
}

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
app.use(express.static(path.join('./public')));

// setup passport, for login and auth
setupPassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// setup extras
app.disable('x-powered-by');
app.use(methodOverride('X-HTTP-Method')) // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')) // Google/GData
app.use(methodOverride('X-Method-Override')) // IBM
app.use(flash());

// setup routes
app.use('/', routes);
app.use('/ajax', ajax);

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
		let _err;
		if (env === 'development') {
			_err = "ERROR: Validation failed. ";
		} else {
			_err = 'Internal Error'
		}
		res.status(400);
		return res.json({
			status: false,
			message: _err
		});
	} else {
		return next();
	}
});

module.exports = app;
