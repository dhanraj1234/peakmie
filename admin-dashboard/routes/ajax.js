var apiStrings = require('../config/apiStrings');
var express = require('express');
var querystring = require('querystring');
var request = require('request');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');

/**
 * Task- function is used for auth checking
 * If req is authenticated then proceed to next router
 */
var authenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(500).json({
        status: 'error',
        errMsg: 'Not Authenticated'
    });
}

/**
 * Task- get all the users count
 * req - GET
 * res- usersCount
 */
router.get('/getUsersCount', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getUsersCount,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);		
        return res.status(200).json({
            status: "ok",
            usersCount: body.usersCount
        });
    });
});

/**
 * Task- get blocked users count (by admin).
 * req- GET
 * res- usersCount
 */
router.get('/getBlockedUsersCount', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getBlockedUsersCount,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            usersCount: body.blockedUsersCount
        });
    });
});

/**
 * Task- get active users count
 * req- GET
 * res- active usersCount
 */
router.get('/getActiveUsersCount', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getActiveUsersCount,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            usersCount: body.activeUsersCount
        });
    });
});

/**
 * Task- get reported post count
 * req - GET
 * res- usersCount
 */
router.get('/getReportedPostsCount', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getReportedPostsCount,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            usersCount: body.reportedPostsCount
        });
    });
});

/**
 * Task- block user by admin
 * req- PUT
 * res- boolean
 */
router.put('/blockUser', authenticated, function(req, res, next) {
        
    request({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        uri: apiStrings.blockUser,
        body: querystring.stringify(req.body),
        method: 'PUT'
    }, function (err, resu, body) {
        
        var result = 'error';
        body = JSON.parse(body);
        
        if (err || body.result == false) {
            result = "error";
        }
        else {
            result = "ok";
        }

        return res.status(200).json({
            status: "ok",
            result: result
        });
    });
});

router.put('/deletePost', authenticated, function(req, res, next) {
        
    request({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        uri: apiStrings.deletePost,
        body: querystring.stringify(req.body),
        method: 'PUT'
    }, function (err, resu, body) {
        
        var result = 'error';
        body = JSON.parse(body);
        
        if (err || body.result == false) {
            result = "error";
        }
        else {
            result = "ok";
        }

        return res.status(200).json({
            status: "ok",
            result: result
        });
    });
});

/**
 * Task- get user list of all users
 * req- GET
 * res- userList
 */
router.get('/getUserList', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getUserList,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);		
        return res.status(200).json({
            status: "ok",
            userList: body.userList
        });
    });
});

/**
 * Task- get blocked user list
 * req- GET
 * res- userList
 */
router.get('/getBlockedUserList', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getBlockedUserList,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            userData: body.user
        });
    });
});

/**
 * Task- get active user list
 * req- GET
 * res- userList
 */
router.get('/getActiveUserList', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getActiveUserList,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            userData: body.user
        });
    });
});

/**
 * Task- get reported posts list
 * req- GET
 * res- userList
 */
router.get('/getReportedPostsList', authenticated, function(req, res, next) {
    request({
        uri: apiStrings.getReportedPostsList,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);	
        return res.status(200).json({
            status: "ok",
            userData: body.user
        });
    });
});

/**
 * Task- get user profile
 * req- GET
 * res- object
 */
router.get('/getUserProfile', authenticated, function(req, res, next) {
    request({
        headers: { "userID": req.query.userID },
        uri: apiStrings.getUserProfileUri,
        method: 'GET'
    }, function (err, resu, body) {		
        body = JSON.parse(body);		
        return res.status(200).json({
            status: "ok",
            userProfile: body.userProfile,
            user: req.user
        });
    });
});

/**
 * Task- forgot password 
 * req- PUT
 * res- boolean
 */
router.put('/forgotPassword', function(req, res, next) {	
    request({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        uri: apiStrings.forgotPassword,
        body: querystring.stringify(req.body),
        method: 'PUT'
    }, function (err, resu, body) {		
        var result = 'error';
        body = JSON.parse(body);
        if (err || body.result == false) {
            result = "error";
        }
        else {
            result = "ok";			
            request({
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                uri: apiStrings.passwordReset,
                body: querystring.stringify({ email: req.body.email, token: body.token }),
                method: 'POST'
            }, function (err, res, body) {
                if(err){
                    console.log("Unable to send mail");
                }
            });
        }
        return res.status(200).json({
            status: "ok",
            result: result
        });
    });
});

/**
 * Task- reset password
 * req- PUT
 * res- boolean
 */
router.put('/resetPassword', function(req, res, next) {
    req.body.token= req.session.token;
    var password= req.body.password;

    bcrypt.hash(password, null, null, function(err, hash) {
        req.body.password= hash;
        request({
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            uri: apiStrings.resetPassword,
            body: querystring.stringify(req.body),
            method: 'PUT'
        }, function (err, resu, body) {
            var result = 'error';
            body = JSON.parse(body);
            if (err || body.result == false) {
                result = "error";
            }
            else {
                result = "ok";
                request({
                    headers: { "token": req.body.token },
                    uri: apiStrings.getUserObjByTokenUri,
                    method: 'GET'
                }, function (err, resu, body) {		
                    body = JSON.parse(body);		
                    request({
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        uri: apiStrings.confirmationMail,
                        body: querystring.stringify({ email: body.user.email }),
                        method: 'PUT'
                    }, function (err, res, body) {
                        if(err){
                            console.log("Unable to send confirmationmail");
                        }
                    });
                });
            }
            return res.status(200).json({
                status: "ok",
                result: result
            });
        });
    });
});

/**
 * Task- Reset password profile
 * req- PUT
 * res- boolean
 */
router.put('/resetPasswordProfile', authenticated, function(req, res, next) {
    req.body.userID = req.user.id;
    var oldPassword= req.body.oldPassword;
    var password= req.body.password;
    bcrypt.compare(oldPassword, req.user.password, function (err, result) {
        if(result != true) {
            return res.status(200).json({
                    status: "error",
                    result: result
            });
        }
        else {
            if (result === true) {
                bcrypt.hash(password, null, null, function(err, hash) {
                    req.body.password= hash;
                    request({
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        uri: apiStrings.resetPasswordAuth,
                        body: querystring.stringify(req.body),
                        method: 'PUT'
                    }, function (err, resu, body) {
                        var result = 'error';
                        body = JSON.parse(body);
                        if (err || body.result == false) {
                            result = "error";
                        }
                        else {
                            result = "ok";
                            request({
                                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                uri: apiStrings.confirmationMail,
                                body: querystring.stringify({ email: req.user.email }),
                                method: 'PUT'
                            }, function (err, res, body) {
                                if(err){
                                    console.log("Unable to send confirmationmail");
                                }
                            });
                        }
                    });
                });
                return res.status(200).json({
                    status: "ok",
                    result: result
                });
            }
        }
        
    });
});

module.exports = router;