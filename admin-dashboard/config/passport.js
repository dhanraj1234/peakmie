var apiStrings = require('../config/apiStrings');
var bcrypt = require('bcrypt-nodejs');
var GoogleAuthenticator = require('passport-2fa-totp').GoogeAuthenticator;
var querystring = require('querystring');
var request = require('request');
var TwoFAStartegy = require('passport-2fa-totp').Strategy;
var NODE_ENV =  process.env.NODE_ENV;

module.exports = function (passport) {
    var INVALID_LOGIN = 'Invalid username or password';
    
    passport.serializeUser(function (user, done) {
        return done(null, user.id);
    });
    
    passport.deserializeUser(function (id, done) {	
        request({
            headers: {
                'userID': id,
            },
            uri: apiStrings.getAdminUserObjUri,
            method: 'GET'
        }, function (err, res, body) {
            body = JSON.parse(body);
            if (err) {
                return done(err);
            } else if(body.status == 'error') {
                return done(null, false);
            } else {

                return done(null, body.user);
            }
        });
    });
    
    // This is commented for time being. Have to uncomment when we
    // implement 2FA
    
    // passport.use('login', new TwoFAStartegy({
    //	 usernameField: 'username',
    //	 passwordField: 'password',
    //	 codeField: 'code'
    // }, function (username, password, done) {
    //	 // 1st step verification: username and password

    //	 process.nextTick(function () {
    //		 var users = db.get().collection('users');
    //		 users.findOne({ username: username }, function (err, user) {
    //			 if (err) {
    //				 return done(err);
    //			 }
                
    //			 if (user === null) {
    //				 return done(null, false, { message: INVALID_LOGIN });
    //			 }
                
    //			 bcrypt.compare(password, user.password, function (err, result) {
    //				 if (err) {
    //					 return done(err);
    //				 }
                    
    //				 if (result === true) {
    //					 return done(null, user);
    //				 } else {
    //					 return done(null, false, { message: INVALID_LOGIN });
    //				 }
    //			 });
    //		 });
    //	 });
    // }, function (user, done) {
    //	 // 2nd step verification: TOTP code from Google Authenticator
        
    //	 if (!user.secret) {
    //		 done(new Error("Google Authenticator is not setup yet."));
    //	 } else {
    //		 // Google Authenticator uses 30 seconds key period
    //		 // https://github.com/google/google-authenticator/wiki/Key-Uri-Format
            
    //		 var secret = GoogleAuthenticator.decodeSecret(user.secret);
    //		 done(null, secret, 30);
    //	 }
    // }));


    passport.use('login', new TwoFAStartegy({
        usernameField: 'username',
        passwordField: 'password',
        codeField: 'code',
        passReqToCallback: true,
        skipTotpVerification: true
    }, function (req, username, password, done) {
        // if(NODE_ENV != 'development' && username != 'test@gmail.com')
        // 	return done(null, false, { message: INVALID_LOGIN });
        
        // 1st step verification: username and password
        process.nextTick(function () {
            console.log('username', username);
            if(username != 'adminpeakmie@gmail.com'){
                return done(null, false, { message: INVALID_LOGIN });
            } else {
                request({
                    headers: {
                        'email': username,
                    },
                    uri: apiStrings.getUserObjByEmailUri,
                    method: 'GET'
                }, function (err, res, body) {			
                    body = JSON.parse(body);
                    if (err) {
                        return done(err);
                    } else if(body.status == 'error' || body.user == null) {
                        return done(null, false, { message: INVALID_LOGIN });
                    }
    
                    bcrypt.compare(password, body.user.password, function (err, result) {
                        if (err) {
                            return done(err);
                        }
                        
                        if (result === true) {
                            return done(null, body.user);
                        } else {
                            return done(null, false, { message: INVALID_LOGIN });
                        }
                    });
                });
            }
        });
    }));
    
};