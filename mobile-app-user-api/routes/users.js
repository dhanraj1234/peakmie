var express = require('express');
var router = express.Router();
var db = require('../utils/query');
var crypto = require("crypto");
var multer = require("multer");
var moment = require("moment");
var fs = require("fs");
var path = require("path");
var bcrypt = require('bcrypt-nodejs');
var generator = require('generate-password');
var sendEmail = require('../utils/email/email.js');
var cron = require('node-cron');
var request = require('request');
var fetch = require('node-fetch');
var _ = require('lodash');
var multerS3 = require('multer-s3')
const Promise = require('bluebird');

var AWS = require('aws-sdk');
var mime = require('mime-types');
var storage = require('../config/storage');
let apn = require('apn');
var FCM = require('fcm-push');

/**
 * Task- send live notification to IOS devices
 */

function sendIos(deviceToken, msg, type, data, totalbadge) {
    return new Promise(function (resolve, reject) {
        var pemKeyFile = path.join(__dirname, "../config/AuthKey_GZX26DP5B4.p8");

        let provider = new apn.Provider({
            token: {
                key: fs.readFileSync(pemKeyFile),
                keyId: "GZX26DP5B4",
                teamId: "599CTE73WB"
            },
            production: false
        });
        let notification = new apn.Notification();
        notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        notification.badge = totalbadge;
        notification.sound = "ping.aiff";
        notification.alert = {
            "title": msg,
        },
        notification.body = {
            notificationType: type,
            body: data,
        };
        
        notification.topic = "com.peakmie";
        provider.send(notification, deviceToken).then((response) => {
            if (response.sent) {
                resolve(true);
            } else {
                reject(false);
            }
        });
    });
}

/**
 * Task- send live notification to Android devices
 */
function sendAndroid(deviceToken, msg, type, data, totalbadge) {
    var serverKey = 'AAAASnPTwqk:APA91bGHRe7lE3z954SgjEpWXHSA9N_4fJnLm01cIo2R6xQlibg4N34x69nrCTZRs61fjLqyd6dHOEcNrCUi-TbkGOuCQlskgM28rOs14VmTc0aOHWzRD41Z6abjyIAw5CP7vq8a6vcO';
    var fcm = new FCM(serverKey);

    var message = {
        to: deviceToken, // required fill with device token or topics
        collapse_key: 'message', 
        data: {
            your_custom_data_key: 'message',
            notificationType: type,
            body: data,
        },
        notification: {
            title: 'Notification from Peakmie',
            body: msg,
        },
        badge:totalbadge,
    };
    return new Promise(function (resolve, reject) {
        fcm.send(message).then((response) => {
            if (response.sent) {
                resolve(true);
            } else {
                reject(false);
            }
        });
    });
}

/**
 * Task- forgot password mail template path
 */
var forgotPasswordPath = path.join(__dirname, "../utils/email/resetPasswordMail.hbs");

/**
 * Task- config AWS
 */
var s3 = new AWS.S3({
    accessKeyId: storage.s3.accessKeyId,
    secretAccessKey: storage.s3.secretAccessKey,
    region: storage.s3.region,
});

/**
 * Task- upload profile images
 */

var uploadProfilePictures = multer({
    storage: multerS3({
        s3: s3,
        bucket: storage.s3.bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, 'users-profiles/' + Date.now() + "-" + file.originalname);
        }
    })
});


/**
 * Task- upload chat images
 */

var uploadChatPictures = multer({
    storage: multerS3({
        s3: s3,
        bucket: storage.s3.bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, 'users-chat-images/' + Date.now() + "-" + file.originalname);
        }
    })
});

/**
 * Task- share images with other users
 */
var shareImages = multer({
    storage: multerS3({
        s3: s3,
        bucket: storage.s3.bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, 'shareImages/' + Date.now() + "-" + file.originalname);
        }
    })
}).array('file', 1);

/**
 * Task- share videos with other users
 */
var shareVideos = multer({
    storage: multerS3({
        s3: s3,
        bucket: storage.s3.bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, 'shareVideos/' + Date.now() + "-" + file.originalname);
        }
    })
}).fields([{
    name: 'file', maxCount: 1
}, {
    name: 'thumbnail', maxCount: 1
}]);

/**
 * Task- share videos thumbnail with other users
 */
var shareThumbnails = multer({
    storage: multerS3({
        s3: s3,
        bucket: storage.s3.bucketName,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, 'shareImages/' + Date.now() + "-" + file.originalname);
        }
    })
}).single('thumbnail');

// ***********Users API's **************************//

/**
 * 1.
* Task- signUp api for new user
* req- POST
* input - name, email, password, username, visibility, gender, platform, deviceToken, user_profile_picture, image file
* output - returns true  or false and userID of new user.
*/
router.post('/users/signup', uploadProfilePictures.array('file', 1), async (req, res, next) => {

    try {
        var imgUrl = req.files[0].location;
        var username = req.body.username;
        var email = req.body.email;
        var fullName = req.body.name;
        var password = req.body.password;
        var gender = req.body.gender;
        var platform = req.body.platform;
        var deviceToken = req.body.devicetoken;
        var loginWith = 'manual';
        var visibility = 'online';
        var country = req.body.country;

        db.checkIfUserExist(email, function (user) {
            if (user) {
                return res.status(500).send({
                    status: false,
                    message: "username or email is already taken",
                });
            } else {
                db.checkIfUserNameExist(username, async (result) => {
                    if (result) {
                        return res.status(500).send({
                            status: false,
                            message: "username or email is already taken",
                        });
                    } else {
                        bcrypt.genSalt(10, function (err, salt) {
                            if (err) {
                                return res.status(500).json({
                                    status: false,
                                    message: err
                                });
                            }
                            bcrypt.hash(password, salt, null, function (err, hash) {
                                if (err) {
                                    return res.status(500).json({
                                        status: false,
                                        message: err
                                    });
                                }
                                db.createUser(fullName, email, hash, username, visibility, gender, platform, deviceToken, imgUrl, country, function (result) {
                                    if (result) {
                                        db.loginUser(result, email, platform, deviceToken, visibility, loginWith, function (result) {
                                            if (result !== 0) {
                                                db.getUserObject(result, async (userProfile) => {
                                                    return res.status(200).json({
                                                        status: true,
                                                        data: userProfile
                                                    });
                                                });
                                            } else {
                                                return res.status(500).send({
                                                    status: false,
                                                    message: "Not able to login",
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err
        });
    }
});

/**
 * 
 * Task- comparePassword function is used for comparing the password with existing password 
 */
var comparePassword = (password, userProfile) => {
    return bcrypt.compareSync(password, userProfile.password);
};

/**
 * 2.
 * Task- Login api 
 * req- POST
 * input parameters - email, password, platform, devicetoken
 * output - userProfile with status true or false
 */
router.post('/users/login', async (req, res, next) => {
    try {
        var email = req.body.email;
        var password = req.body.password;
        var platform = req.body.platform;
        var deviceToken = req.body.devicetoken;
        var visibility = 'online';
        var loginWith = 'manual';

        if (!email) {
            return res.status(500).send({
                status: false,
                message: "Please enter your emailID",
            });
        } else {
            db.checkIfUserExist(email, function (user) {
                if (user) {
                    db.getUserProfile(email, async (userProfile) => {
                        try {
                            var validPassword = await comparePassword(password, userProfile);
                            if (validPassword) {
                                db.loginUser(userProfile.id, userProfile.email, platform, deviceToken, visibility, loginWith, function (result) {
                                    if (result !== 0) {
                                        db.updateUserStatusToOnline(result, deviceToken, async (value) => {
                                            if (value) {
                                                db.getUserObject(result, async (userProfile) => {
                                                    return res.status(200).json({
                                                        status: true,
                                                        data: userProfile
                                                    });
                                                });
                                            } else {
                                                return res.status(500).send({
                                                    status: false,
                                                    message: "Not able to login",
                                                });
                                            }
                                        })
                                    } else {
                                        return res.status(500).send({
                                            status: false,
                                            message: "Not able to login",
                                        });
                                    }
                                });
                            } else {
                                return res.status(500).send({
                                    status: false,
                                    message: "wrong password, Please try again",
                                });
                            }
                        } catch (err) {
                            return res.status(500).send({
                                status: false,
                                message: err,
                            });
                        }
                    });
                } else {
                    return res.status(500).send({
                        status: false,
                        message: "user not exist",
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error in Login",
        });
    }
});

/**
 * 3.
 * Task- login With facebook
 * req- POST
 * res- object
 */
router.post('/users/facebooklogin', async (req, res, next) => {
    try {
        var email = req.body.email;
        var platform = req.body.platform;
        var deviceToken = req.body.devicetoken;
        var name = req.body.name;
        var visibility = 'online';
        var imgUrl = req.body.profileurl;
        var loginWith = 'facebook';
        var country = (req.body.country)?req.body.country:'';
        if (!email) {
            return res.status(500).send({
                status: false,
                message: "Please pass your emailID",
            });
        } else {
            db.checkIfUserExist(email, function (user) {
                if (!user) {
                    db.createUser(name, email, null, null, visibility, null, platform, deviceToken, imgUrl,country, function (result) {
                        if (result) {
                            db.getUserObject(result, async (userProfile) => {

                                if (userProfile) {
                                    db.loginUser(userProfile.id, userProfile.email, platform, deviceToken, visibility, loginWith, function (result) {
                                        if (result !== 0) {
                                            db.updateUserStatusToOnline(result, deviceToken, async (value) => {
                                                if (value) {
                                                    db.getUserObject(result, async (userProfile) => {
                                                        return res.status(200).json({
                                                            status: true,
                                                            data: userProfile
                                                        });
                                                    });
                                                } else {
                                                    return res.status(500).send({
                                                        status: false,
                                                        message: "Not able to login",
                                                    });
                                                }
                                            })
                                        } else {
                                            return res.status(500).send({
                                                status: false,
                                                message: "Not able to login",
                                            });
                                        }
                                    });
                                } else {
                                    return res.status(500).send({
                                        status: false,
                                        message: "Not able to login",
                                    });
                                }
                            });
                        }
                    });
                } else {

                    db.getUserObjectByEmail(email, async (userProfile) => {
                        if (userProfile) {
                            db.loginUser(userProfile.id, userProfile.email, platform, deviceToken, visibility, loginWith, function (result) {
                                if (result !== 0) {
                                    db.updateUserStatusToOnline(result, deviceToken, async (value) => {
                                        if (value) {
                                            db.getUserObject(result, async (userProfile) => {
                                                return res.status(200).json({
                                                    status: true,
                                                    data: userProfile
                                                });
                                            });
                                        } else {
                                            return res.status(500).send({
                                                status: false,
                                                message: "Not able to login",
                                            });
                                        }
                                    });
                                } else {
                                    return res.status(500).send({
                                        status: false,
                                        message: "Not able to login",
                                    });
                                }
                            });
                        } else {
                            return res.status(500).send({
                                status: false,
                                message: "Not able to login",
                            });
                        }
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error in Login",
        });
    }
});

/**
 * 4.
 * Task- login With google
 * req- POST
 * res- object
 */
router.post('/users/googlelogin', async (req, res, next) => {
    try {
        var email = req.body.email;
        var platform = req.body.platform;
        var deviceToken = req.body.devicetoken;
        var name = req.body.name;
        var visibility = 'online';
        var imgUrl = req.body.profileurl;
        var loginWith = 'google';
        var country = (req.body.country)?req.body.country:'';
        if (!email) {
            return res.status(500).send({
                status: false,
                message: "Please pass your emailID",
            });
        } else {
            db.checkIfUserExist(email, function (user) {
                if (!user) {
                    db.createUser(name, email, null, null, visibility, null, platform, deviceToken, imgUrl,country, function (result) {
                        if (result) {
                            db.getUserObject(result, async (userProfile) => {

                                if (userProfile) {
                                    db.loginUser(userProfile.id, userProfile.email, platform, deviceToken, visibility, loginWith, function (result) {
                                        if (result !== 0) {
                                            db.updateUserStatusToOnline(result, deviceToken, async (value) => {
                                                if (value) {
                                                    db.getUserObject(result, async (userProfile) => {
                                                        return res.status(200).json({
                                                            status: true,
                                                            data: userProfile
                                                        });
                                                    });
                                                } else {
                                                    return res.status(500).send({
                                                        status: false,
                                                        message: "Not able to login",
                                                    });
                                                }
                                            })
                                        } else {
                                            return res.status(500).send({
                                                status: false,
                                                message: "Not able to login",
                                            });
                                        }
                                    });
                                } else {
                                    return res.status(500).send({
                                        status: false,
                                        message: "Not able to login",
                                    });
                                }
                            });
                        }
                    });
                } else {

                    db.getUserObjectByEmail(email, async (userProfile) => {
                        if (userProfile) {
                            db.loginUser(userProfile.id, userProfile.email, platform, deviceToken, visibility, loginWith, function (result) {
                                if (result !== 0) {
                                    db.updateUserStatusToOnline(result, deviceToken, async (value) => {
                                        if (value) {
                                            db.getUserObject(result, async (userProfile) => {
                                                return res.status(200).json({
                                                    status: true,
                                                    data: userProfile
                                                });
                                            });
                                        } else {
                                            return res.status(500).send({
                                                status: false,
                                                message: "Not able to login",
                                            });
                                        }
                                    });
                                } else {
                                    return res.status(500).send({
                                        status: false,
                                        message: "Not able to login",
                                    });
                                }
                            });
                        } else {
                            return res.status(500).send({
                                status: false,
                                message: "Not able to login",
                            });
                        }
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error in Login",
        });
    }
});

/**
 * 5.
 * Task- Logout api 
 * req- POST
 * input parameters - userid, platform, devicetoken
 * output - userProfile with status true or false
 */
router.post('/users/logout', async (req, res, next) => {
    try {
        var userID = req.get('peakmie-header-token');
        var platform = req.body.platform;
        var deviceToken = req.body.devicetoken;
        var visibility = 'offline';
        if (!userID) {
            return res.status(500).send({
                status: false,
                message: "Please enter your userid",
            });
        } else {
            db.checkIfUserExistByUserID(userID, function (user) {
                if (user) {
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.logoutUser(userID, platform, deviceToken, visibility, date, function (result) {

                        if (result) {
                            db.updateUserStatusToOffline(userID, null, async (value) => {
                                if (value) {
                                    return res.status(200).json({
                                        status: true,
                                        data: value
                                    });
                                } else {
                                    return res.status(500).send({
                                        status: false,
                                        message: "Error in logout",
                                    });
                                }
                            });
                        } else {
                            return res.status(500).send({
                                status: false,
                                message: "Error in logout",
                            });
                        }
                    });
                } else {
                    return res.status(500).send({
                        status: false,
                        message: "user not exist",
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error in Logout",
        });
    }
});

/**
 * Task- forgot password api
 * req- POST
 * res- boolean
 */
router.post('/users/forgotPassword', async (req, res, next) => {
    try {
        var email = req.body.email;
        db.checkIfUserExist(email, async (user) => {
            if (user) {
                var password = await generator.generate({
                    length: 10,
                    numbers: true
                });
                bcrypt.genSalt(10, function (err, salt) {
                    if (err) {
                        return res.status(500).json({
                            status: "err",
                            message: err
                        });
                    }
                    bcrypt.hash(password, salt, null, function (err, hash) {
                        if (err) {
                            return res.status(500).json({
                                status: "err",
                                message: err
                            });
                        }
                        db.updatePassword(email, hash, async (message) => {
                            var fpMail = await sendEmail.sendHtmlMail({
                                email: email,
                                password: password,
                            }, req.body.email, 'Forgot Password Email - Peakmie', forgotPasswordPath);

                            return res.status(200).send({
                                status: "Success",
                                message: fpMail,
                            });
                        });
                    });
                });
            } else {
                return res.status(500).send({
                    status: "Not found",
                    message: "user not exist",
                });
            }
        });
    } catch (err) {
        return res.status(500).send({
            status: "Fail",
            message: "Error in forgot password",
        });
    }
});

/**
 * 6.
 * Task- get All users
 * req- GET
 * res- userList
 */
router.get('/users/userlist', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var isblocked = false;
        var status = 'accepted';

        var userData = [];
        db.getUserList(userID, status, function (listOfUsers) {
            if (listOfUsers) {
                db.getUserListByFriend(userID, async (userList) => {

                    if (userList.length > 0) {
                        for (var i = 0; i < userList.length; i++) {
                            if ((i < userList.length) && (userID != userList[i].id)) {
                                var removedUsers = _.remove(listOfUsers, ['id', userList[i].id]);
                                await userData.push(userList[i]);
                            }
                            if (i == userList.length - 1) {
                                var removeBlockUsers = _.remove(userData, ['isblocked', true]);
                                var fullData = _.concat(listOfUsers, userData);
                                var dataList = _.remove(fullData, ['status', 'accepted']);
                                return res.status(200).json({
                                    status: true,
                                    userList: fullData
                                });
                            }
                        }
                    } else {
                        return res.status(200).json({
                            status: true,
                            userList: listOfUsers
                        });
                    }
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting user list'
        });
    }
});

/**
 * 7.
 * Task- get user object with userID
 * req- GET
 * res- user object
 */
router.get('/users/userdetails', function (req, res, next) {
    var userID = req.get('peakmie-header-token');
    try {
        db.getUserObject(userID, function (user) {
            if (user) {
                return res.status(200).json({
                    status: true,
                    user: user
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'User not found'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting user details'
        });
    }
});

/**
 * 8
 * Task- send friend request
 * req- POST
 * res- notification send to IOS or Android
 */
router.post('/users/addfriend', function (req, res, next) {

    var senderUserID = req.get('peakmie-header-token');
    var receiverUserID = req.body.receiverid;
    var status = 'sent';
    var type = 'requestSent';
    try {
        if (senderUserID == receiverUserID) {
            return res.status(500).json({
                status: false,
                message: "Enter valid id's"
            });
        }
        if (!senderUserID || !receiverUserID) {
            return res.status(500).json({
                status: false,
                message: "Enter senderID and receiverID"
            });
        } else {
            db.checkIfRowExist(senderUserID, receiverUserID, function (user) {
                if (user) {
                    var rowStatus = true;
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.addFriend(senderUserID, receiverUserID, date, status, type, rowStatus, function (result) {
                        db.getUserDeviceObject(receiverUserID, async (devices) => {
                            if(devices){
                                devices.forEach(async (device) => {
                                    db.getUserObject(senderUserID, async (senderUser) => {

                                        if (device) {
                                            var senderData = {
                                                id: senderUser.id,
                                                name: senderUser.name,
                                                email: senderUser.email,
                                                username: senderUser.username,
                                                url: senderUser.userprofilepictureurl,
                                            };
                                            var getbadges = `http://localhost:1416/users/badges`;
                                            var badges = await fetch(getbadges, {
                                                headers: {
                                                    'peakmie-header-token': `${receiverUserID}`,
                                                },
                                            });
                                            var { badges } = await badges.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `You received a friend request from ${senderUser.name}`, 'friendRequest', senderData,badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `You received a friend request from ${senderUser.name}`, 'friendRequest', senderData,badges);
                                            }
                                            
                                        }
                                        
                                    });
                                });
                            }
                            return res.status(200).json({
                                status: true,
                                data: result
                            });
                        });
                    });
                } else {
                    var rowStatus = false;
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.addFriend(senderUserID, receiverUserID, date, status, type, rowStatus, function (result) {
                        db.getUserDeviceObject(receiverUserID, async (devices) => {
                            if(devices){
                                devices.forEach(async (device) => {
                                    db.getUserObject(senderUserID, async (senderUser) => {

                                        if (device) {
                                            var senderData = {
                                                id: senderUser.id,
                                                name: senderUser.name,
                                                email: senderUser.email,
                                                username: senderUser.username,
                                                url: senderUser.userprofilepictureurl,
                                            };
                                            var getbadges = `http://localhost:1416/users/badges`;

                                            var badges = await fetch(getbadges, {
                                                headers: {
                                                    'peakmie-header-token': `${receiverUserID}`,
                                                },
                                            });
                                            var { badges } = await badges.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `You received a friend request from ${senderUser.name}`, 'friendRequest', senderData,badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `You received a friend request from ${senderUser.name}`, 'friendRequest', senderData,badges);
                                            }
                                        }
                                        
                                    });
                                });
                            }
                            return res.status(200).json({
                                status: true,
                                data: result
                            });
                        });
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err
        });
    }
});

/**
 * 9
 * Task- get friend request list
 * req- GET
 * res- requestList
 */
router.get('/users/friendrequestList', function (req, res, next) {
    var userID = req.get('userId');
    var status = 'sent';
    try {
        db.getFriendRequestList(userID, status, function (list) {
            if (!list) {
                return res.status(500).json({
                    status: false,
                    message: "No Request is found",
                });
            } else {
                var userList = list;
                userList.filterDate = list.requestsentat;

                return res.status(200).json({
                    status: true,
                    userList: userList
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting friends list'
        });
    }
});

/**
 * 10
 * Task- add friend request accept
 * req- POST
 * res- boolean
 */
router.post('/users/acceptfriendrequest', function (req, res, next) {
    var userID = req.get("peakmie-header-token");
    var requestUserid = req.body.userbyid;
    var status = 'accepted';
    var type = 'accepted';
    try {
        if (!userID || !requestUserid) {
            return res.status(500).json({
                status: false,
                message: "Please enter userID"
            });
        } else {
            db.checkIfUserExistByUserID(requestUserid, function (user) {
                if (user) {
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.acceptFriendRequest(userID, requestUserid, date, status, type, function (result) {
                        if (result) {
                            db.getUserObject(userID, async (user) => {
                                db.getUserDeviceObject(requestUserid, async (devices) => {
                                    devices.forEach(async (device) => {
                                        if (device) {
                                            var getbadges = `http://localhost:1416/users/badges`;
                                                var badges = await fetch(getbadges, {
                                                    headers: {
                                                        'peakmie-header-token': `${requestUserid}`,
                                                    },
                                                });
                                                var { badges } = await badges.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `${user.name} accepted your friend request`, 'acceptedRequest', user,badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `${user.name} accepted your friend request`, 'acceptedRequest', user,badges);
                                            }
                                            return res.status(200).json({
                                                status: true,
                                                data: "Friend Request Accepted"
                                            });
                                        }
                                    });
                                });
                            });

                        } else {
                            return res.status(500).json({
                                status: false,
                                message: 'Error in accepting friend request'
                            });
                        }
                    });
                } else {
                    return res.status(500).json({
                        status: false,
                        data: "User Not Found"
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in accepting friend request'
        });
    }
});

/**
 * 11
 * Task- reject friend request
 * req- POST
 * res- boolean
 */
router.post('/users/rejectfriendrequest', function (req, res, next) {

    var userID = req.get('peakmie-header-token');
    var requestUserid = req.body.userbyid;
    var status = 'sent';

    try {
        if (!userID || !requestUserid) {
            return res.status(500).json({
                status: false,
                message: "Enter userID"
            });
        } else {
            db.checkIfUserExistByUserID(requestUserid, function (user) {
                if (user) {
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.rejectFriendRequest(userID, requestUserid, status, function (result) {
                        if (result) {
                            return res.status(200).json({
                                status: true,
                                data: "Friend Request Rejected"
                            });
                        } else {
                            return res.status(500).json({
                                status: false,
                                message: 'Error in rejecting the friend request'
                            });
                        }
                    });
                } else {
                    return res.status(500).json({
                        status: false,
                        data: "User Not Found"
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in rejecting friend request'
        });
    }
});

/**
 * 12.
 * get friends list
 */
router.get('/users/friendslist', function (req, res, next) {
    var userID = req.get("peakmie-header-token");
    var status = 'accepted';
    var postId = (req.query.postid)?req.query.postid:false;
    try {
        db.getFriendsList(userID, status, postId, async (passed) => {
            if (passed) {
                var newData = [];
                for (var i = 0; i < passed.length; i++) {
                    if (passed[i].id != userID) {
                        await newData.push(passed[i]);
                    }
                }
                return res.status(200).json({
                    status: true,
                    data: newData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting friend list'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting friend list'
        });
    }
});
/**
 * 12.
 * get accepted friend list of notification
 */
router.get('/users/acceptedfriendslist', function (req, res, next) {
    var userID = req.get("peakmie-header-token");
    var status = 'accepted';

    try {
        db.getNotificationListOfRequestAccept(userID, status, async (passed) => {
            if (passed) {
                var newData = [];
                for (var i = 0; i < passed.length; i++) {
                    if (passed[i].id != userID) {
                        passed[i].filterDate = passed[i].requestacceptedate;
                        await newData.push(passed[i]);
                    }
                }
                return res.status(200).json({
                    status: true,
                    data: newData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting friend list'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting friend list'
        });
    }
});

/**
 * 13
 * update user status active to block by user
 */
router.post('/users/blockUser', function (req, res, next) {

    try {
        var userID = req.get('peakmie-header-token');
        var blockedId = req.body.blockid;
        var currentDate = new Date();
        var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");

        db.checkIfRowExist(userID, blockedId, function (user) {
            if (user) {
                db.blockUserByUser(userID, blockedId, date, user, function (passed) {
                    if (passed) {
                        return res.status(200).json({
                            status: true,
                            data: 'User successfully has been blocked'
                        });
                    } else {
                        return res.status(500).json({
                            status: false,
                            message: 'Sorry unable to block this user'
                        });
                    }
                });
            } else {
                db.blockUserByUser(userID, blockedId, date, user, function (passed) {
                    if (passed) {
                        return res.status(200).json({
                            status: true,
                            data: 'User successfully has been blocked'
                        });
                    } else {
                        return res.status(500).json({
                            status: false,
                            message: 'Sorry unable to block this user'
                        });
                    }
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in process of blocking perticular user'
        });
    }
});

/**
 * 14.
 * update user status block to un-block by user
 */
router.post('/users/unblockuser', function (req, res, next) {

    try {
        var userID = req.get('peakmie-header-token');
        var blockId = req.body.blockid;

        var currentDate = new Date();
        var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
        db.unBlockUserByUser(userID, blockId, date, function (passed) {
            if (passed) {
                return res.status(200).json({
                    status: true,
                    data: 'User successfully unblocked'
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Sorry unable to unblock this user'
                });
            }
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in process of un-blocking perticular user'
        });
    }
});

/**
 * 15. get blocked userlist
 */
router.get('/users/blockedUserList', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        db.getBlockedUserListForUser(userID, function (userList) {
            if (userList) {
                return res.status(200).json({
                    status: true,
                    data: userList
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'No block user'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting block userlist'
        });
    }
});

/**
 * 16
 * unfriend  request
 */
router.post('/users/unfriend', function (req, res, next) {

    var userID = req.get('peakmie-header-token');
    var requestUserid = req.body.unfriendId;
    var status = '';

    try {
        if (!userID || !requestUserid) {
            return res.status(500).json({
                status: false,
                message: "Enter userID"
            });
        } else {
            db.checkIfUserExistByUserID(requestUserid, function (user) {
                if (user) {
                    var currentDate = new Date();
                    var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                    db.removeFriend(userID, requestUserid, date, status, function (result) {
                        if (result) {
                            return res.status(200).json({
                                status: true,
                                data: "Friend Removed from friends list"
                            });
                        } else {
                            return res.status(500).json({
                                status: false,
                                message: 'Error in removing friend from friend list'
                            });
                        }
                    });
                } else {
                    return res.status(500).json({
                        status: false,
                        data: "User Not Found"
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in removing friend from friendList'
        });
    }
});

/**
 * 17.
 * get users chat list with userid
 */
router.get('/users/chatlist', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');

        db.getUsersChatList(userID, async (users) => {
            var chatListData = [];
            await Promise.map(users, ({ msgbyid, msgtoid }) => {
                return new Promise(async (resolve, reject) => {
                    await db.getChatListByUserID(userID, msgbyid, msgtoid, async (chatList) => {
                        chatListData.push(chatList);
                        return resolve(chatListData);
                    });
                })
            });
            var chatData = _.flattenDeep(chatListData);
            var chatListWithUserProfile = _.uniqBy(chatData, 'chatid');
            return res.status(200).json({
                status: true,
                data: chatListWithUserProfile
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting users chat'
        });
    }
});
router.get('/users/badges', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        db.getUsersChatListBadges(userID, async (users) => {
            var chatListData = 0;
            await Promise.map(users, ({ msgbyid, msgtoid }) => {
                return new Promise(async (resolve, reject) => {
                    await db.getChatListByUserID(userID, msgbyid, msgtoid, async (chatList) => {
                        chatListData = Number(chatListData)+Number(chatList[0].total_unseen);
                        return resolve(chatListData);
                    });
                })
            });

            var getFriendRequestList = `http://localhost:1416/users/friendrequestList`;

            var friendRequestResponse = await fetch(getFriendRequestList, {
                headers: {
                    userId: `${userID}`,
                },
            });
            var { userList } = await friendRequestResponse.json();
            // get post list which are shared with this userID and not readed
            var getPostList = `http://localhost:1416/users/unreadedpostsforme`;

            var postSharedResponse = await fetch(getPostList, {
                headers: {
                    'peakmie-header-token': `${userID}`,
                },
            });
            var { unreadedPost } = await postSharedResponse.json();
            var totalBadges = (chatListData)?chatListData/2:chatListData;
            if(unreadedPost){
                totalBadges = Number(totalBadges) + Number(unreadedPost);
            }
            if(userList.length > 0){
                totalBadges = Number(totalBadges) + Number(userList.length);
            }
            return res.status(200).json({
                status: true,
                badges: totalBadges
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting users chat'
        });
    }
});
router.get('/users/unreadedpostsforme', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        db.unreadedpostsforme(userID, function (unreadedPost) {
            if (unreadedPost) {
                return res.status(200).json({
                    status: true,
                    unreadedPost: unreadedPost
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting personal chat'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting personal chat'
        });
    }
});
/**
 * 18.
 * get chat details with two id's
 */
router.get('/users/personalChat', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var userChatWithId = req.query.userChatWithId;
        var status = true;
        db.getPersonalChat(userID, userChatWithId, status, function (chat) {
            if (chat) {
                var sortChatData = _.orderBy(chat, ['createdat'], ['asc']);
                return res.status(200).json({
                    status: true,
                    data: sortChatData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting personal chat'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting personal chat'
        });
    }
});
/**
 * check is comment like or not
 */
function checkCommentLikeByMe(commentid, userID, type) {
    return new Promise(async (resolve, reject) => {

        await db.getCommentslikeByMe(commentid, userID, type, async (value) => {
            var data = (value == true) ? value : false;
            resolve(data);
        });
    });
};

/**
 * get comment list
 */
router.get('/users/commentlist', function (req, res, next) {

    try {
        var userID = req.get('peakmie-header-token');
        var postId = req.query.postId;
        var status = true;
        var type = 'likecomment';

        db.getCommentList(userID, postId, async (chat) => {

            if (chat) {
                var filterData = [];

                // await Promise.map(chat, async ({ commentid }, index) => {

                //     return new Promise(async (resolve, reject) => {
                //         await db.getCommentslikecount(commentid, async (data) => {
                //             chat[index].likeCommentCount = data;
                //             filterData.push(chat[index]);
                //             return resolve(filterData);
                //         });
                //     })
                // });
                // await Promise.map(chat, async ({ commentid }, index) => {
                //     return new Promise(async (resolve, reject) => {
                //         await db.getCommentslikeByMe(commentid, userID, type, async (value) => {
                //             var data = (value == true) ? value : false;
                //             filterData[index].commentLikeByMe = data;
                //             return resolve(filterData);
                //         });
                //     });
                // });

                var chatData = _.flattenDeep(chat);
                var sortCommentList = _.orderBy(chatData, ['createdat'], ['asc']);

                return res.status(200).json({
                    status: true,
                    data: sortCommentList
                });

            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting comment list32'
                });
            }
        });

    } catch (err) {

        return res.status(500).json({
            status: false,
            message: 'Error in getting comment list'
        });
    }
});

/**
 * 19.
 * send msg to other user with userid
 */
router.post('/users/sendmessage', uploadChatPictures.array('file', 3), function (req, res, next) {
    try {

        var imgUrl = '';
        if (!req.body.message){
            imgUrl = req.files[0].location;
        }
        var userID = req.get('peakmie-header-token');
        var userChatWithId = req.body.userChatWithId;
        var chatData = req.body.message;
        var currentDate = new Date();
        var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");

        db.sendMsgToOtherUser(userID, userChatWithId, chatData, date, imgUrl,false, async (chat) =>{
            if (chat) {
                var getbadges = `http://localhost:1416/users/badges`;
                var badgesObj = await fetch(getbadges, {
                    headers: {
                        'peakmie-header-token': `${userChatWithId}`,
                    },
                });
                var { badges } = await badgesObj.json();
                db.getUserDeviceObject(userChatWithId, async (devices) => {
                    devices.forEach(async (device) => {
                        db.getUserObject(userID, async (user) => {
                            db.getChatObject(chat.chatid, async (chatObject) => {
                                if (device) {
                                    chatObject.name = user.name;
                                    if (device.platform === 'ios') {
                                        await sendIos(device.devicetoken, `You have a new message from ${user.name}`, 'message', chatObject,badges);
                                    } else {
                                        await sendAndroid(device.devicetoken, `You have a new message from ${user.name}`, 'message', chatObject,badges);
                                    }
                                    return res.status(200).json({
                                        status: true,
                                        message: 'Message has been sent successfully'
                                    });
                                }
                            });
                        });
                    });
                });

            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in sending personal msg'
                });
            }
        });

    }    catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in sending personal msg'
        });
    }
});

/**
 * 19.
 * send msg to other user with userid
 */
router.get('/users/chatmedia',function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var userChatWithId = req.query.userChatWithId;
        db.chatMediaList(userID, userChatWithId, function (media) {
            var chatMediaList = _.orderBy(media, ['createdat'], ['asc']);
            return res.status(200).json({
                status: true,
                data: chatMediaList
            });
        });
    }catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting media'
        });
    }
});

/**
 * 20.
 * image post upload function w/r/t userID
 */
router.post("/users/uploadUserPostPic", function (req, res) {
    try {
        shareImages(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: err
                });
            } else {

                var imgUrl = req.files[0].location;
                var thumbImgUrl = false;
                var user_id = req.get('peakmie-header-token');
                var maxVisitCount = req.body.maxVisitCount;
                var visibilityTime = req.body.visibilityTime;
                var gender = req.body.gender;
                var ratingType = req.body.ratingType;
                // it should be array whome he want to send
                var usersIds = req.body.shareids;
                var type = 'imagepost';
                var postSharedWith = JSON.parse("[" + usersIds + "]");
                var parentId ="0";
                var parentUserId =req.body.parentUserId;
                var via=false;
                for (var i = 0; i < postSharedWith.length; i++) {
                    if (i < postSharedWith.length) {
                        db.uploadUserPost(user_id, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postSharedWith[i], type,parentId,parentUserId,via,thumbImgUrl, function (message) {
                            if (!message) {
                                return res.status(500).json({
                                    status: false,
                                    message: 'Error in sharing user post with' + postSharedWith[i]
                                });
                            }
                            db.getUserDeviceObject(postSharedWith[i], async (devices) => {
                                devices.forEach(async (device) => {
                                    db.getUserObject(user_id, async (sender) => {

                                        if (device) {
                                            var senderData = {
                                                id: sender.id,
                                                name: sender.name,
                                                email: sender.email,
                                                username: sender.username,
                                                url: sender.userprofilepictureurl,
                                            };
                                            var getbadges = `http://localhost:1416/users/badges`;
                                            var badgesObj = await fetch(getbadges, {
                                                headers: {
                                                    'peakmie-header-token': `${postSharedWith[i]}`,
                                                },
                                            });
                                            var { badges } = await badgesObj.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `${sender.name} shared post with you`, 'imagePostShared', senderData,badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `${sender.name} shared post with you`, 'imagePostShared', senderData,badges);
                                            }
                                        }

                                    });
                                });
                            });
                        });
                    }
                    if (i == postSharedWith.length - 1) {

                        return res.status(200).json({
                            status: true,
                            message: 'Post has been successfully shared'
                        });
                    }
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in uploading user post'
        });
    }
});

/**
 * 21.
 * upload user post videos
 */
router.post("/users/uploadPostsVideos", function (req, res) {
    try {
        shareVideos(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: err
                });
            } else {
                var type = 'videopost';
                var imgUrl = req.files['file'][0].location;
                var thumbImgUrl = req.files['thumbnail'][0].location;
                var user_id = req.get('peakmie-header-token');
                var maxVisitCount = req.body.maxVisitCount;
                var visibilityTime = req.body.visibilityTime;
                var gender = req.body.gender;
                var ratingType = req.body.ratingType;
                // it should be array whome he want to send
                var usersIds = req.body.shareids;
                var postSharedWith = JSON.parse("[" + usersIds + "]");
                var parentId="0";
                var parentUserId=req.body.parentUserId;
                var via =false;
                for (var i = 0; i < postSharedWith.length; i++) {
                    if (i < postSharedWith.length) {
                        db.uploadUserPost(user_id, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postSharedWith[i], type,parentId, parentUserId,via,thumbImgUrl,function (message) {
                            if (!message) {
                                return res.status(500).json({
                                    status: false,
                                    message: 'Error in sharing user post with' + postSharedWith[i]
                                });
                            }
                            db.getUserDeviceObject(postSharedWith[i], async (devices) => {
                                devices.forEach(async (device) => {
                                    db.getUserObject(user_id, async (sender) => {

                                        if (device) {
                                            var senderData = {
                                                id: sender.id,
                                                name: sender.name,
                                                email: sender.email,
                                                username: sender.username,
                                                url: sender.userprofilepictureurl,
                                            };
                                            var getbadges = `http://localhost:1416/users/badges`;
                                            var badgesObj = await fetch(getbadges, {
                                                headers: {
                                                    'peakmie-header-token': `${postSharedWith[i]}`,
                                                },
                                            });
                                            var { badges } = await badgesObj.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `${sender.name} shared post with you`, 'videoPostShared', senderData,badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `${sender.name} shared post with you`, 'videoPostShared', senderData,badges);
                                            }
                                        }

                                    });
                                });
                            });
                            
                        });
                    }
                    if (i == postSharedWith.length - 1) {
                        
                        return res.status(200).json({
                            status: true,
                            message: 'Post has been successfully shared'
                        });
                    }
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in uploading user post'
        });
    }
});

/**
 * share friend post to other friends
 */
router.post("/users/sharefriendpost", function (req, res) {
    try {
        shareVideos(req, res, async (err) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: err
                });
            } else {
                var user_id = req.get('peakmie-header-token');
                var imgUrl = req.files['file'][0].location;
                var thumbImgUrl = false;
                if(req.body.postType == "videopost"){
                    var thumbImgUrl = req.files['thumbnail'][0].location;
                }
                var postType = req.body.postType;
                var maxVisitCount = req.body.maxVisitCount;
                var visibilityTime = req.body.visibilityTime;
                var gender = req.body.gender;
                var ratingType = req.body.ratingType;
                var postId = req.body.postId;
                var parentUserId = req.body.parentUserId;
                var via = req.body.via;
                /**
                 * share post with 1 or more than 1 friend
                 */
                var usersIds = req.body.shareids;
                var type = 'friendpost';
                var postSharedWith = JSON.parse("[" + usersIds + "]");
                db.getPostById(postId, function (data) {
                    if (data) {
                        if (data.postexpired) {
                            return res.status(200).json({
                                status: true,
                                message: 'post visibilty time has been expired you can not share this post now'
                            });
                        } else {
                            for (var i = 0; i < postSharedWith.length; i++) {
                                if (i < postSharedWith.length) {
                                    db.uploadUserPost(user_id, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postSharedWith[i], postType, postId,parentUserId,via,thumbImgUrl, function (message) {
                                        if (!message) {
                                            return res.status(500).json({
                                                status: false,
                                                message: 'Error in sharing user post with' + postSharedWith[i]
                                            });
                                        }
                                        db.getUserDeviceObject(postSharedWith[i], async (devices) => {
                                            devices.forEach(async (device) => {
                                                db.getUserObject(user_id, async (sender) => {
                                                    if (device) {
                                                        var getbadges = `http://localhost:1416/users/badges`;
                                                        var badgesObj = await fetch(getbadges, {
                                                            headers: {
                                                                'peakmie-header-token': `${postSharedWith[i]}`,
                                                            },
                                                        });
                                                        var { badges } = await badgesObj.json();
                                                        if (device.platform === 'ios') {
                                                            
                                                            await sendIos(device.devicetoken, `${sender.name} shared post with you`, postType, sender,badges);
                                                        } else {
                                                            await sendAndroid(device.devicetoken, `${sender.name} shared post with you`, postType, sender,badges);
                                                        }
                                                    }

                                                });
                                            });
                                        });
                                    });
                                }
                                if (i == postSharedWith.length - 1) {

                                    return res.status(200).json({
                                        status: true,
                                        message: 'Post has been successfully shared'
                                    });
                                }
                            }
                        }
                    } else {
                        return res.status(500).json({
                            status: false,
                            message: 'Error in fetching post details'
                        });
                    }
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in uploading user post'
        });
    }
});
/**
 * 22.
 * get post with userid
 */
router.get('/users/postsforme', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var selectedUserID = (req.query.userid)?req.query.userid:false;
        db.getPostsForMe(userID,selectedUserID, function (post) {
            if (post) {
                var sortChatData = _.orderBy(post, ['createdat'], ['desc']);
                var filterData = [];
                sortChatData.map(async (value) => {
                    value.filterDate = value.createdat;
                    await filterData.push(value);
                });

                return res.status(200).json({
                    status: true,
                    postList: filterData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in fetching post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting posts'
        });
    }
});

/**
 * 23.
 * comment on post with userid
 */
router.post('/users/commentonpost', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postID = req.body.postid;
        var commentValue = req.body.commentValue;
        var type = 'comment';
        // check if comment is already done by this userid or not if so then update
        db.commentOnPost(userID, postID, commentValue, type, function (post) {

            if (post) {
                // db.getPostObject(postID, async (postData) => {
                //     db.getUserDeviceObject(postData.userid, async (devices) => {
                //         devices.forEach(async (device) => {
                //             db.getUserObject(userID, async (sender) => {

                //                 if (device) {
                //                     if (device.platform === 'ios') {
                //                         await sendIos(device.devicetoken, `${sender.name} commented on your post`, 'commentonpost', sender);
                //                     } else {
                //                         await sendAndroid(device.devicetoken, `${sender.name} commented on your post`, 'commentonpost', sender);
                //                     }
                return res.status(200).json({
                    status: true,
                    data: 'Comment on post has been Successfully submitted'
                });
                //                 }
                //             });
                //         });
                //     });
                // });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in comment on post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in comment on post'
        });
    }
});

/**
 * like on post with userid
 */
router.post('/users/ratingonpost', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postID = req.body.postid;
        var commentValue = req.body.commentValue;
        var postUserId = req.body.postUserId;
        var type = 'likeonpost';
        // check if comment is already done by this userid or not if so then update 
        db.ratingOnPost(userID, postID, commentValue, type, function (post) {
            if (post) {
                // db.getUserDeviceObject(postUserId, async (devices) => {
                //     devices.forEach(async (device) => {
                //         db.getUserObject(userID, async (sender) => {

                //             if (device) {
                //                 if (device.platform === 'ios') {

                //                     await sendIos(device.devicetoken, `${sender.name} like   your post`, 'postlike', sender);
                //                 }else {
                //                     await sendAndroid(device.devicetoken, `${sender.name} like   your post`, 'postlike', sender);
                //                 }
                return res.status(200).json({
                    status: true,
                    data: 'Post Successfully liked'
                });
                //             }
                //         });
                //     });
                // });

            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in like on post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in like on post'
        });
    }
});


/**
 * get list of likes on post with postid
 */
router.get('/users/getlikesonpost', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postID = req.query.postid;
        var type = 'likeonpost';

        db.getListofLikeOnPost(postID, type, function (listOfLikes) {

            if (listOfLikes) {
                return res.status(200).json({
                    status: true,
                    listOfLikesOnPost: listOfLikesOnPost
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting like on post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting like on post'
        });
    }
});

/**
 * get list of likes on post with postid
 */
router.get('/users/getlikesoncomment', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var commentId = req.query.commentId;
        var type = 'likecomment';

        db.getListofLikeOnCommentByCommentID(commentId, type, function (listOfLikesonComment) {

            if (listOfLikesonComment) {
                return res.status(200).json({
                    status: true,
                    listOfLikesonComment: listOfLikesonComment
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting like on post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting like on post'
        });
    }
});
/**
*  24.like on comment
*/
router.post('/users/likeoncomment', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var commentId = req.body.commentId;
        var likeCommentValue = req.body.likeCommentValue;
        var type = "likecomment";

        db.likeOnComment(userID, commentId, likeCommentValue, type, function (post) {
            if (post) {

                db.getCommentObject(commentId, async (commentData) => {
                    db.getUserDeviceObject(commentData.userid, async (devices) => {
                        devices.forEach(async (device) => {
                            db.getUserObject(userID, async (sender) => {
                                if (device) {
                                    var getbadges = `http://localhost:1416/users/badges`;
                                    var badgesObj = await fetch(getbadges, {
                                        headers: {
                                            'peakmie-header-token': `${commentData.userid}`,
                                        },
                                    });
                                    var { badges } = await badgesObj.json();
                                    if (device.platform === 'ios') {
                                        await sendIos(device.devicetoken, `${sender.name} liked your comment`, 'likecomment', sender,badges);
                                    } else {
                                        await sendAndroid(device.devicetoken, `${sender.name} liked your comment`, 'likecomment', sender,badges);
                                    }
                                    return res.status(200).json({
                                        status: true,
                                        data: 'Successfully comment liked by you'
                                    });
                                }
                            });
                        });
                    });
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in like on comment'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in like on post'
        });
    }
});

/**
 * 25.
 * delte comment from post with userid
 */
router.post('/users/deletecommentfrompost', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postID = req.body.postid;

        var currentDate = new Date();
        var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");

        db.deleteCommentFromPost(userID, postID, function (post) {
            if (post) {
                return res.status(200).json({
                    status: true,
                    data: 'Successfully comment deleted from the post'
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in deleting comment from post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in deleting comment on post'
        });
    }
});


/**
*  26.
* un-Like  post with userid
*/
router.post('/users/unlikepost', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postID = req.body.postid;

        db.unLikePost(userID, postID, function (post) {
            if (post) {
                return res.status(200).json({
                    status: true,
                    data: 'Unliked post done'
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in un-like on post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in un-like on post'
        });
    }
});

/**
 * 27. get my post list 
 */
router.get('/users/postsofme', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');

        db.getPostsOfMe(userID, function (post) {
            if (post) {
                var sortChatData = _.orderBy(post, ['createdat'], ['desc']);
                return res.status(200).json({
                    status: true,
                    postData: sortChatData
                });
            } else {
                return res.status(200).json({
                    status: true,
                    message: 'No Post shared by you'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting posts'
        });
    }
});


/**
 * 27. get post viewer list 
 */
router.get('/users/postviewerlist', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var postId = req.query.postId;
        var type = 'view';

        db.getPostViewerList(postId, type, function (viewers) {
            if (viewers) {
                var sortChatData = _.orderBy(viewers, ['createdat'], ['desc']);
                return res.status(200).json({
                    status: true,
                    data: sortChatData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'No Viewer exist for this post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting viewer list'
        });
    }
});

/**
 * 27. get post viewer list 
 */
router.get('/users/ratingaverage', function (req, res, next) {
    try {
        var postId = req.query.postId;
        var type = 'likeonpost';

        db.getPostViewerLike(postId, type, function (avg) {
            return res.status(200).json({
                status: true,
                ratingAverage : avg
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting viewer list'
        });
    }
});

/**
 * 28. update user profile
 */
router.post('/users/updateUserProfile', uploadProfilePictures.array('file', 1), function (req, res, next) {

    try {
        var userID = req.get('peakmie-header-token');
        var imgUrl = req.files[0].location;
        var name = req.body.name;
        var gender = req.body.gender;

        db.updateUserProfile(userID, name, gender, imgUrl, function (result) {
            if (result) {
                db.getUserObject(userID, async (userProfile) => {
                    return res.status(200).json({
                        status: true,
                        data: userProfile
                    });
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in updating your profile'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in updating your profile'
        });
    }
});

/**
 * 29. get post details with postID
 */
router.get('/users/postdetails', function (req, res, next) {
    try {
        var userId = req.get('peakmie-header-token');
        var postId = req.query.postid;
        var type = 'view';
        db.getPostViewCount(postId, function (value) {

            var postCount = value + 1;
            db.isViewerExist(userId,postId, type, function (isExist) {
                if (isExist) {
                    db.getPostDetails(postId, userId, function (result) {
                        if (result) {
                            return res.status(200).json({
                                status: true,
                                data: result
                            });
                        } else {
                            return res.status(500).json({
                                status: false,
                                message: 'Error in getting post details'
                            });
                        }
                    });
                } else {
                    db.updatePostViewCount(postId, postCount, function (ispassed) {
                        if (ispassed) {
                            db.updateViewerList(userId, type, postId, function (ress) {
                                if (ress) {
                                    db.getPostDetails(postId, userId, function (result) {
                                        if (result) {
                                            result['0'].is_viewed = false;
                                            return res.status(200).json({
                                                status: true,
                                                data: result
                                            });
                                        } else {
                                            return res.status(500).json({
                                                status: false,
                                                message: 'Error in getting post details'
                                            });
                                        }
                                    });
                                } else {
                                    return res.status(500).json({
                                        status: false,
                                        message: 'Error in updating post viewers list'
                                    });
                                }
                            })
                        } else {
                            return res.status(500).json({
                                status: false,
                                message: 'Error in updating post view count'
                            });
                        }
                    });
                }
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting post details'
        });
    }
});


router.post('/users/postreport', async (req, res, next) => {
    try {
        var userId = req.get('peakmie-header-token');
        var postId = req.body.postid;
        var currentDate = new Date();
        var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");

        db.updateReportedPostStatus(postId, userId, date, function (passed) {
            if (passed) {
                return res.status(200).json({
                    status: true,
                    message: 'successfully post report'
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in reporting post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in reporting post'
        });
    }
});

/**
 * 29.
 * get notifications for friend request
 */
router.get('/users/notification', async (req, res, next) => {
    try {
        var userID = req.get('peakmie-header-token');

        /**
         * 1. get friend request list
         */
        var getFriendRequestList = `http://localhost:1416/users/friendrequestList`;

        var friendRequestResponse = await fetch(getFriendRequestList, {
            headers: {
                userId: `${userID}`,
            },
        });
        var { userList } = await friendRequestResponse.json();

        /**
         * 2. get friend accepted list
         */
        var getFriendRequestAcceptList = `http://localhost:1416/users/acceptedfriendslist`;

        var friendRequestAcceptedResponse = await fetch(getFriendRequestAcceptList, {
            headers: {
                'peakmie-header-token': `${userID}`,
            },
        });
        var { data } = await friendRequestAcceptedResponse.json();

        /**
        //  * 3.get post list which are shared with this userID
        //  */
        // var getPostList = `http://localhost:1416/users/postsforme`;

        // var postSharedResponse = await fetch(getPostList, {
        //     headers: {
        //         'peakmie-header-token': `${userID}`,
        //     },
        // });
        // var { postList } = await postSharedResponse.json();

        /**
         * 4.get all posts list which are shared by me.
         */
        // var getMyPostList = `http://localhost:1416/users/postsofme`;

        // var postResponse = await fetch(getMyPostList, {
        //     headers: {
        //         'peakmie-header-token': `${userID}`,
        //     },
        // });
        // var { postData } = await postResponse.json();

        //var commentList = [];
        // if (postData) {
        //     await Promise.map(postData, ({ postid }) => {
        //         return new Promise(async (resolve, reject) => {
        //             db.getCommentList(userID, postid, async (comment) => {
        //                 commentList.push(comment);
        //                 return resolve(commentList);
        //             });
        //         })
        //     });
        // }

        // var filterCommentList = _.flattenDeep(commentList);
        //var commentListData = [];

        // for (var i = 0; i < filterCommentList.length; i++) {
        //     filterCommentList[i].filterDate = filterCommentList[i].createdat;
        //     await commentListData.push(filterCommentList[i]);
        // }

        
        /**
         * get expried Post list
         */
        var getMyPostList = `http://localhost:1416/users/expriedpostsforme`;

        var postResponse = await fetch(getMyPostList, {
            headers: {
                'peakmie-header-token': `${userID}`,
            },
        });
        var { expriedPostListData } = await postResponse.json();

        /**
         * get expried Post list which is not shared.
         */
        var getMynotSharedPostList = `http://localhost:1416/users/expriedpostsnotsharedforme`;
        var postResponse1 = await fetch(getMynotSharedPostList, {
            headers: {
                'peakmie-header-token': `${userID}`,
            },
        });
        var { expriedPostNotSharedListData } = await postResponse1.json();
        //var listUsers = _.concat(userList, data, postList, commentListData, expriedPostListData,expriedPostNotSharedListData);
        var listUsers = _.concat(userList, data, expriedPostListData,expriedPostNotSharedListData);
        // var filterData = _.sortBy(listUsers, 'filterDate', ['desc']);
        // var notificationList = _.reverse(filterData);
        var filterData = listUsers.sort(function compare(a, b) {
            var dateA = new Date(a.filterDate);
            var dateB = new Date(b.filterDate);
            return dateA - dateB;
        });
        var notificationList = _.reverse(filterData);
        return res.status(200).json({
            status: true,
            data: notificationList
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting notification'
        });
    }
});

/**
 * 30. update post status to expire visibilty time
 */
router.post('/users/postTimeExpired', function (req, res, next) {
    try {
        db.getNotExpiredPosts(function (results) {
            if (results) {
                results.forEach(async (result) => {
                    var postVisibiltyTime = result.visibilitytime;
                    var postTime = postVisibiltyTime * 3600;
                    var currentDate = moment(new Date());
                    var postCreatedAt = moment(result.createdat);
                    var newDiff = currentDate.diff(postCreatedAt, 'seconds');
                    var postId = result.postid;
                    var userId = result.userId;
                    if (newDiff >= postTime) {
                        db.updatePostStatusToExpired(postId, currentDate, function (result) {
                            db.getUserDeviceObject(userId, async (devices) => {
                                if(devices){
                                    devices.forEach(async (device) => {
                                        if (device) {
                                            var senderData = {
                                                postid: postId,
                                            };
                                            var getbadges = `http://localhost:1416/users/badges`;
                                            var badgesObj = await fetch(getbadges, {
                                                headers: {
                                                    'peakmie-header-token': `${userId}`,
                                                },
                                            });
                                            var { badges } = await badgesObj.json();
                                            if (device.platform === 'ios') {
                                                await sendIos(device.devicetoken, `You post has been expired ${postId}`, 'postExpired', senderData, badges);
                                            } else {
                                                await sendAndroid(device.devicetoken, `You post has been expired ${postId}`, 'postExpired', senderData, badges);
                                            }
                                            return res.status(200).json({
                                                status: true,
                                                data: result
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
                return res.status(200).json({
                    status: true,
                    data: 'Expired post has been excuted'
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in updating the status of post'
        });
    }
});

/**
 * 31.
 * get expried post with userid
 */
router.get('/users/expriedpostsforme', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');

        db.getExpriedPostList(userID, function (post) {
            if (post) {
                var sortChatData = _.orderBy(post, ['postexpiredat'], ['desc']);
                var filterData = [];
                sortChatData.map(async (value) => {
                    value.filterDate = value.postexpiredat;
                    value.type = "postexpired";
                    await filterData.push(value);
                });

                return res.status(200).json({
                    status: true,
                    expriedPostListData: filterData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in fetching post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting posts'
        });
    }
});

/**
 * 31.
 * get expried post with userid
 */
router.get('/users/expriedpostsnotsharedforme', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        db.getExpriedPostNotSharedList(userID, function (post) {
            if (post) {
                var sortChatData = _.orderBy(post, ['postexpiredat'], ['desc']);
                var filterData = [];
                sortChatData.map(async (value) => {
                    value.filterDate = value.postexpiredat;
                    value.type = "expiredpostnotshared";
                    await filterData.push(value);
                });

                return res.status(200).json({
                    status: true,
                    expriedPostNotSharedListData: filterData
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in fetching post'
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting posts'
        });
    }
});

/**
 * 31. get expried post details with postID
 */
router.get('/users/expriedpostdetails', function (req, res, next) {
    try {
        var postId = req.query.postid;
        var userID = req.get('peakmie-header-token');
        db.getExpriedPostDetail(postId, function (result) {
            if (result) {
                return res.status(200).json({
                    status: true,
                    data: result
                });
            } else {
                return res.status(500).json({
                    status: false,
                    message: 'Error in getting post details'
                });
            }
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting post details'
        });
    }
});

/**
 * Task- save report on post
 * req- POST
 */
// router.post('/users/postreport', function (req, res, next) {
//     try {
//         var senderUserID = req.get('peakmie-header-token');
//         var postId = req.body.postid;
//         var currentDate = new Date();
//         var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
//         db.addPostReport(senderUserID, postId, date, function (result) {
//             if (result) {
//                 return res.status(200).json({
//                     status: true,
//                     data: result
//                 });
//             } else {
//                 return res.status(500).json({
//                     status: false,
//                     message: 'Error in saving post report. Please try again.'
//                 });
//             }
//         });
//     } catch (err) {
//         return res.status(500).json({
//             status: false,
//             message: err
//         });
//     }
// });

/**
 * Task- Get random n number of users for friend suggestion api.
 * req- GET
 */
router.get('/users/friendsuggestions', function (req, res, next) {
    try {
        var userID = req.get('peakmie-header-token');
        var status = 'accepted';
        var limit = (req.query.limit)?req.query.limit : 3;
        var userData = [];
        db.getUserList(userID, status, function (listOfUsers) {
            if (listOfUsers) {
                
                db.getUserListByFriend(userID, async (userList) => {
                    if (userList.length > 0) {
                        for (var i = 0; i < userList.length; i++) {
                            if ((i < userList.length) && (userID != userList[i].id)) {
                                var removedUsers = _.remove(listOfUsers, ['id', userList[i].id]);
                                await userData.push(userList[i]);
                            }
                            if (i == userList.length - 1) {
                                var removeBlockUsers = _.remove(userData, ['isblocked', true]);
                                listOfUsers = _.sampleSize(listOfUsers, limit);
                              //  var fullData = _.concat(listOfUsers, userData);
                                
                                return res.status(200).json({
                                    status: true,
                                    data: listOfUsers
                                });
                            }
                        }
                    } else {
                        listOfUsers = _.sampleSize(listOfUsers, limit);
                        return res.status(200).json({
                            status: true,
                            data: listOfUsers
                        });
                    }
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: 'Error in getting post details'
        });
    }
});
/*****************************Admin Api's*************************/
/**
 * signUp for admin
 */
router.post('/signUpForAdmin', async (req, res, next) => {
    var email = req.body.email;
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password
    var gender = req.body.gender;
    try {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return res.status(500).json({
                    status: false,
                    msg: err
                });
            }
            bcrypt.hash(password, salt, null, function (err, hash) {
                if (err) {
                    return res.status(500).json({
                        status: false,
                        msg: err
                    });
                }
                db.createUserAdmin(name, username, email, hash, gender, function (msg) {
                    return res.status(200).json({
                        status: true,
                        msg: msg
                    });
                });
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            msg: err
        });
    }
});

/**
 * Login for Admin
 */
router.post('/signIn', async (req, res, next) => {
    try {
        var email = req.body.email;
        var password = req.body.password;
        if (!email) {
            return res.status(500).send({
                status: "error",
                msg: "Please enter your emailID",
            });
        } else {
            db.getUserProfileAdmin(email, async (userProfile) => {
                try {
                    var validPassword = await comparePassword(password, userProfile);
                    if (validPassword) {
                        return res.status(200).send({
                            status: true,
                            data: userProfile,
                        });
                    } else {
                        return res.status(500).send({
                            status: false,
                            msg: "wrong password, Please try again",
                        });
                    }
                } catch (err) {
                    return res.status(500).send({
                        status: false,
                        msg: err,
                    });
                }
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error in Login",
        });
    }
});

/**
 * Check user exist or not w/r/t email Id
 */
router.get('/get/checkIfUserExist/:email', function (req, res, next) {
    try {
        var email = req.params.email;
        db.checkIfUserExistAdmin(email, function (passed) {
            return res.status(200).json({
                status: true,
                result: passed
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in checking user exist or not"
        });
    }
});

/**
 * get User by email Id
 */
router.get('/get/userObjectByEmail', function (req, res, next) {
    try {
        var email = req.get("email");
        db.getUserObjectByEmail(email, function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user object"
        });
    }
});

/**
 * get User by email Id
 */
router.get('/get/userObjectByEmailAdmin', function (req, res, next) {
    try {
        var email = req.get("email");
        db.getUserObjectByEmailAdmin(email, function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user object"
        });
    }
});

/**
 * get user object by username
 */
router.get('/get/userObjectByUsername', function (req, res, next) {
    try {
        var username = req.get("username");
        db.getUserObjectByUsername(username, function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user object"
        });
    }
});

/**
 * get All users count
 */
router.get('/get/usersCount', function (req, res, next) {
    try {
        db.getUsersCount(function (usersCount) {
            return res.status(200).json({
                status: true,
                usersCount: usersCount
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting users count"
        });
    }
});

/**
 * get Blocked user count for admin only those users which are blocked by admin
 */
router.get('/get/blockedUsersCount', function (req, res, next) {
    try {
        db.getBlockedUsersCount(function (usersCount) {
            return res.status(200).json({
                status: true,
                blockedUsersCount: usersCount
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting blocked user count"
        });
    }
});

/**
 * get Active Users Count which are not blocked by admin
 */
router.get('/get/getActiveUsersCount', function (req, res, next) {
    try {
        db.getActiveUsersCount(function (usersCount) {
            return res.status(200).json({
                status: true,
                activeUsersCount: usersCount
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting active users count"
        });
    }
});

/**
 * get Reported posts count
 */
router.get('/get/getReportedPostsCount', function (req, res, next) {
    try {
        db.getReportedPostsCount(function (usersCount) {
            return res.status(200).json({
                status: true,
                reportedPostsCount: usersCount
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting repoted posts count"
        });
    }
});

/**
 * get Blocked users list
 */
router.get('/get/blockedUserList', function (req, res, next) {
    try {
        db.getBlockedUserList(function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting blocked user list"
        });
    }
});

/**
 * get Active user list
 */
router.get('/get/getActiveUserList', function (req, res, next) {
    try {
        db.getActiveUserList(function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting active user list"
        });
    }
});

/**
 * get Reported Posts List
 */
router.get('/get/getReportedPostsList', function (req, res, next) {
    try {
        db.getReportedPostsList(function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in get reported posts list"
        });
    }
});

/**
 * block user by admin
 */
router.put('/put/blockUser', function (req, res, next) {
    try {
        var userID = req.body.userID;
        var status = req.body.status;
        var blocked_at = new Date();
        db.blockUser(userID, status, blocked_at, function (passed) {
            return res.status(200).json({
                status: true,
                result: passed
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in blocking user"
        });
    }
});

/**
 * unblock user by admin
 */
router.put('/put/unBlockUser', function (req, res, next) {
    var status = "temp";
    try {
        db.getBlockedUserList(function (user) {
            if (user) {
                var i;
                for (i = 0; i < user.length; i++) {
                    var currentDate = moment(new Date());
                    var otpDate = moment(user[i].blocked_at);
                    var newDiff = currentDate.diff(otpDate, 'seconds');
                    var userID = user[i].id;

                    if (newDiff > 2592000) {
                        db.unBlockUser(userID, status, function (passed) {

                        });
                    }
                }
                if (i == user.length) {
                    return res.status(200).json({
                        status: true
                    });
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in unblocking user"
        });
    }
});

/**
 * Post Delete by admin
 */
router.put('/put/deletePost', function (req, res, next) {
    try {
        var postId = req.body.postId;
        db.deletePost(postId, function (passed) {
            return res.status(200).json({
                status: true,
                result: passed
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in blocking user"
        });
    }
});

router.get('/get/adminuserObject', function (req, res, next) {
    var userID = req.get('userID');
    try {
        db.getAdminUserObject(userID, function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user object"
        });
    }
});

/**
 * get user object w/r/t userID
 */
router.get('/get/userObject', function (req, res, next) {
    var userID = req.get('userID');
    try {
        db.getUserObject(userID, function (user) {
            return res.status(200).json({
                status: true,
                user: user
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user object"
        });
    }
});

/**
 * get user list
 */
router.get('/get/userList', function (req, res, next) {
    try {
        db.getUserListAdmin(function (userList) {
            return res.status(200).json({
                status: true,
                userList: userList
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Error in getting user list"
        });
    }
});


module.exports = router;