var apiStrings = require('../config/apiStrings');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');
var NODE_ENV = process.env.NODE_ENV;

var authenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	return res.redirect('/');
}

/**
* Task- Check if user is already authenticated. If yes, redirect to /dashboard page.
* req: GET
**/
router.get('/', function (req, res, next) {

	if (req.isAuthenticated()) {
		return res.redirect('/dashboard');
	}
	var errors = req.flash('error');
	return res.render('index', {
		errors: errors
	});
});

/**
* Task- User sign in request
* req- POST
**/
router.post('/', function (req, res, next) {
	next();
}, passport.authenticate('login', {
	failureRedirect: '/#loginsection',
	failureFlash: true,
	badRequestMessage: 'Invalid username or password.'
}), function (req, res, next) {
	return res.redirect('/dashboard');
});

/**
* Task- Home page for admin after login.
* req- GET
**/
router.get('/dashboard', authenticated, function (req, res, next) {

	return res.render("dashboard", {
		user: req.user
	});
});

/**
* Task- Shows the data of each registered user.
* req- GET
**/
router.get('/users', authenticated, function (req, res, next) {
	return res.render("users", {
		user: req.user
	});
});


/**
* Task- It show's the all the blocked users
* req- GET
**/
router.get('/blocked_request', authenticated, function (req, res, next) {
	return res.render("blockedUser_request", {
		user: req.user
	});
});

/**
* Task- It show's the all the active users
* req- GET
**/
router.get('/active_request', authenticated, function (req, res, next) {
	return res.render("active_request", {
		user: req.user
	});
});

/**
* Task- It show's the all the reported posts
* req- GET
**/
router.get('/reported_posts', authenticated, function (req, res, next) {
	return res.render("reported_posts", {
		user: req.user
	});
});

/**
* Task- Get user profile
* req- GET
**/
router.get('/profile', authenticated, function (req, res, next) {
	return res.render('profile', {
		user: req.user
	});
});

/**
* Task- logout user
* req- GET
**/
router.get('/logout', function (req, res, next) {
	req.logout();
	return res.redirect('/');
});

/**
 * Task- forgot password page route
 * req- GET
 */
router.get('/forgotPassword', function (req, res, next) {
	return res.render('forgotPassword', {
	});
});

/**
 * Task- reset password
 * req- GET
 */
router.get('/resetPassword', function (req, res, next) {
	request({
		headers: { "token": req.query.token },
		uri: apiStrings.getUserObjByTokenUriForgotPassword,
		method: 'GET'
	}, function (err, resu, body) {
		body = JSON.parse(body);
		if (body.user == null) {
			return res.render('invalidUrl', {
			});
		}
		else {
			req.session.token = req.query.token;
			return res.render('resetPassword', {
			});
		}
	});
});

module.exports = router;
