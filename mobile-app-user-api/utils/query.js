var db = require('./db');
var express = require('express');
var router = express.Router();
var app = express();
var express = require('express');
var moment = require("moment");
var router = express.Router();
var settings = require('../config/settings');
var _ = require('lodash');

module.exports = {

    /**
    * createUser function is used to create new user
    * input - name, email, password, username, visibility, gender, platform, deviceToken, user_profile_picture, country
    * output - returns true  or false and userID of new user.
    */
    createUser: function (name, email, password, username, visibility, gender, platform, deviceToken, userprofilepictureurl, country, next) {

        var sqlQuery = "INSERT INTO users(name, email, password, username, visibility, gender, platform, deviceToken, userprofilepictureurl, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id AS userID";
        db.getPg().query(sqlQuery, [name, email, password, username, visibility, gender, platform, deviceToken, userprofilepictureurl, country], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows[0].userid);
            }
        });
    },

    /**
     * Task- sign up for admin
     * params- name, username, email, hash, gender
     * res- object id
     */
    createUserAdmin: function (name, username, email, hash, gender, next) {

        var sqlQuery = "INSERT INTO tbladmin(name, username, email, password, gender) VALUES ($1, $2, $3, $4, $5) RETURNING id AS userID";
        db.getPg().query(sqlQuery, [name, username, email, hash, gender], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows[0].userid);
            }
        });
    },

    /**
     * Task- get post id count
     * params- userID
     * res- total count of post
     */
    getPostIdCount: function (user_id, next) {

        db.getPg().query("SELECT COUNT(*) AS count FROM usersposts WHERE userid=$1", [user_id], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(++result.rows[0].count);
            }
        });
    },

    /**
     * Task- upload user post
     * params- userid, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postsharewith, type
     * res- boolean
     */
    uploadUserPost: function (user_id, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postsharewith, type, parentId = "",parentUserId =false,via=false,videothumbnail=false, next) {

        var sqlQuery = "INSERT INTO usersposts(userid, url, maxvisitcount, visibilitytime, gender, ratingtype, postsharewith, type, parentid,parentUserId,via,videothumbnail) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10,$11,$12)";
        db.getPg().query(sqlQuery, [user_id, imgUrl, maxVisitCount, visibilityTime, gender, ratingType, postsharewith, type, parentId,parentUserId,via,videothumbnail], function (err, result) {
            if (err) {
                next(false);
            } else {
                if(postsharewith){
                    var getCheckPersonalChat = "SELECT count(*) as chat FROM friendschat WHERE msgtoid=$2 and msgbyid=$1";
                    db.getPg().query(getCheckPersonalChat, [user_id,postsharewith], function (err, chat) {
                        if (err) {
                            next(false);
                        } else {
                            var type = "postShared";
                            if (chat.rows[0].chat != 0) {
                                var updateShareStatusPersonalChat = 'UPDATE friendschat SET is_shared=true, type=$3 where msgtoid=$2 and msgbyid=$1';
                                db.getPg().query(updateShareStatusPersonalChat, [user_id,postsharewith,type], function (err, update) {
                                    if (err) {
                                        next(false);
                                    } else {
                                        next(true); 
                                    }
                                });
                            } else {
                                var currentDate = new Date();
                                var date = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
                                var sendMsgToOtherUser = "INSERT INTO friendschat (msgbyid, msgtoid, msgvalue, createdat, url, is_shared,type) values ($1, $2, $3, $4, $5,$6,$7)  RETURNING chatid AS chatID";
                                db.getPg().query(sendMsgToOtherUser, [user_id,postsharewith,"",date,"",true,type], function (err, update) {
                                    if (err) {
                                        next(false);
                                    } else {
                                        next(true);
                                    }
                                });
                            }
                            
                        }
                    });
                }else{
                    next(true);
                }
            }
        });
    },
    uploadUserPostThumb: function (postId, imgUrl, next) {

        var sqlQuery = "UPDATE usersposts SET videothumbnail = $2 where postid=$1";
        db.getPg().query(sqlQuery, [postId, imgUrl], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });
    },
    /**
     * Task- check user exist or not 
     * params- email
     * res- boolean
     */
    checkIfUserExist: function (email, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM users WHERE email=$1", [email], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
     * check user exist or not w/r/t admin emailID
     */
    checkIfUserExistAdmin: function (email, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM tbladmin WHERE email=$1", [email], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },
    /**
    * check user exist or not w/r/t emailID
    */
    checkIfUserExistByUserID: function (userID, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM users WHERE id=$1", [userID], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },
    /**
     * check add friend request sent is not
     */
    checkIfUserExistByUserIDAddFriend: function (userID, receiverId, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM addfriend WHERE (useridby=$1 and useridto=$2) and status='sent'", [userID, receiverId], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },
    /**
     * get user profile w/r/t email
     */
    getUserProfile: function (email, next) {
        db.getPg().query("SELECT * FROM users WHERE email=$1", [email], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(null);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    /**
     * get user profile w/r/t admin email
     */
    getUserProfileAdmin: function (email, next) {
        db.getPg().query("SELECT * FROM tbladmin WHERE email=$1", [email], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(null);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    /**
     * get users list
     */
    getUserListByFriend: function (userID, next) {

        var sqlQuery = "select addfriend.useridby, addfriend.status, addfriend.isblocked, addfriend.requestacceptedate, addfriend.type, users.id, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on addfriend.useridby = users.id or addfriend.useridto=users.id where (addfriend.useridby = $1 or addfriend.useridto=$1)";
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get users list
     */
    getUserList: function (userID, status, next) {

        var sqlQuery = "select * from users where id!=$1";
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get users list for admin
     */
    getUserListAdmin: function (next) {
        var sqlQuery = "select name, username, email, id, gender, visibility, isblocked, blockedtype, userprofilepictureurl, platform, createdat from users";
        db.getPg().query(sqlQuery, function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get user object by userID
     */
    getUserObject: function (userID, next) {
        db.getPg().query("SELECT * FROM users where id=$1", [userID], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    /**
     * get user object by userID
     */
    getAdminUserObject: function (userID, next) {
        db.getPg().query("SELECT * FROM tbladmin where id=$1", [userID], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    /**
     * get logined device tokens object by userID
     */
    getUserDeviceObject: function (userID, next) {
        db.getPg().query("SELECT devicetoken,platform FROM logindetails where userid=$1 and loggedoutat IS NULL", [userID], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }else {
                next(result.rows);
            }
        });
    },
    
    /**
     * get post Object by postID
     */
    getPostObject: function (postID, next) {
        db.getPg().query("SELECT * FROM usersposts where postid=$1", [postID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    /**
     * getCommentObject by commentId
     */
    getCommentObject: function (commentid, next) {
        db.getPg().query("SELECT * FROM usersactivityonpost where commentid=$1", [commentid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    /**
     * get chat object by chatId
     */
    getChatObject: function (chatID, next) {
        db.getPg().query("SELECT * FROM friendschat where chatid=$1", [chatID], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    /**
     * check row exist or not w/r/t useridby and useridto
     */
    checkIfRowExist: function (userIdBy, userIdTo, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM addfriend WHERE useridby=$1 and useridto=$2", [userIdBy, userIdTo], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },
    /**
     * add friend request sender function
     */
    addFriend: function (requestBy, requestTo, date, status, type, rowStatus, next) {
        if (rowStatus) {

            var sqlQuery = 'UPDATE addfriend SET status=$4, requestsentat=$3, type=$5 where useridby=$1 and useridto=$2';
            db.getPg().query(sqlQuery, [requestBy, requestTo, date, status, type], function (err, result) {
                if (err) {
                    next(false);
                } else {
                    next('request has been sent successfully');
                }
            });
        } else {

            var sqlQuery = "INSERT INTO addfriend(useridby, useridto, requestsentat, status, type) VALUES ($1, $2, $3, $4, $5)";

            db.getPg().query(sqlQuery, [requestBy, requestTo, date, status, type], function (err, result) {
                if (err) {
                    next(false);
                } else {
                    next('request has been sent successfully');
                }
            });
        }
    },

    /**
     * get friend requests lists
     */
    getFriendRequestList: function (userID, status, next) {
        var sqlQuery = "select addfriend.useridby, addfriend.useridto, addfriend.status, addfriend.isblocked, addfriend.requestsentat, addfriend.type, users.id, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on addfriend.useridby = users.id where addfriend.useridto = $1 and addfriend.status=$2 and addfriend.isblocked=false";
        db.getPg().query(sqlQuery, [userID, status], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
    * get user profile w/r/t email
    */
    getFriendsList: function (userID, status, postId, next) {
        if(postId){
            var sqlQuery = "select distinct users.id, addfriend.status, addfriend.isblocked, addfriend.requestacceptedate, addfriend.type, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on addfriend.useridto = users.id or addfriend.useridby = users.id where (addfriend.useridby = $1 or addfriend.useridto=$1) and addfriend.status=$2 and addfriend.isblocked=false and addfriend.isarchived=true and users.id not in (SELECT id FROM users WHERE id!=$1 AND EXISTS (SELECT * FROM addfriend WHERE addfriend.useridby =$1 and addfriend.useridto= users.id and isblocked=true)) and users.id not in (SELECT parentuserid FROM usersposts WHERE postid=$3)";
            db.getPg().query(sqlQuery, [userID, status, postId], function (err, result) {
                if (err) {
                    next(false);
                }
                else {
                    next(result.rows);
                }
            });
        }else{
            var sqlQuery = "select distinct users.id, addfriend.status, addfriend.isblocked, addfriend.requestacceptedate, addfriend.type, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on addfriend.useridto = users.id or addfriend.useridby = users.id where (addfriend.useridby = $1 or addfriend.useridto=$1) and addfriend.status=$2 and addfriend.isblocked=false and addfriend.isarchived=true and users.id not in (SELECT id FROM users WHERE id!=$1 AND EXISTS (SELECT * FROM addfriend WHERE addfriend.useridby =$1 and addfriend.useridto= users.id and isblocked=true))";
            db.getPg().query(sqlQuery, [userID, status], function (err, result) {
                if (err) {
                    next(false);
                }
                else {
                    next(result.rows);
                }
            });
        }
        
    },

    /**
    * get user profile w/r/t email
    */
   getFriendsuggestions: function (userID, limit, next) {
        
        var sqlQuery = "Select users.* from users left join addfriend on addfriend.useridto != $1 or addfriend.useridby != users.id where (addfriend.useridby != $1 or addfriend.useridto != users.id) and users.id != $1 ORDER BY random() LIMIT $2";
        db.getPg().query(sqlQuery, [userID,limit], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
    * get chat uploaded media files
    */
    chatMediaList: function (userID, userChatWithId, next) {
        var sqlQuery = "select * from friendschat where ((msgbyid=$1 and msgtoid=$2) or (msgbyid=$2 and msgtoid=$1)) and url != ''";
        db.getPg().query(sqlQuery, [userID, userChatWithId], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    /**
     * get notification request accept
     */
    getNotificationListOfRequestAccept: function (userID, status, next) {
        var sqlQuery = "select addfriend.status, addfriend.useridto, addfriend.useridby, addfriend.isblocked, addfriend.requestacceptedate, addfriend.type, users.id, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on addfriend.useridto = users.id where (addfriend.useridby = $1) and addfriend.status=$2 and addfriend.isblocked=false";
        db.getPg().query(sqlQuery, [userID, status], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * add login details to database
     */
    loginUser: function (userID, email, platform, deviceToken, visibility, loginWith, next) {

        var sqlQuery = "INSERT INTO logindetails(userid, email, platform, devicetoken, status, loginby) VALUES ($1, $2, $3, $4, $5, $6) RETURNING userid AS userID";
        db.getPg().query(sqlQuery, [userID, email, platform, deviceToken, visibility, loginWith], function (err, result) {
            if (err) {
                next(0);
            } else {
                next(result.rows[0].userid);
            }
        });
    },
    /**
     * user logout function
     */
    logoutUser: function (userID, platform, deviceToken, visibility, date, next) {

        var sqlQuery = "UPDATE logindetails SET platform=$2, status=$4, loggedoutat=$5, lastloginat=$5, devicetoken='' where userid=$1 and devicetoken=$3";
        db.getPg().query(sqlQuery, [userID, platform, deviceToken, visibility, date], function (err, result) {

            if (err) {
                next(false);
            } else {
                next(true);
            }
        });
    },

    /**
     * update user status offline to online when login done
     */
    updateUserStatusToOnline: function (userID, deviceToken, next) {
        var sqlQuery = "update users SET visibility = 'online', devicetoken=$2 where id=$1";
        db.getPg().query(sqlQuery, [userID, deviceToken], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });
    },

    /**
     * update user status online to offline when logout done
     */
    updateUserStatusToOffline: function (userID, devicetoken, next) {

        var sqlQuery = "update users SET visibility = 'offline' where id=$1";
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            } else {
                next('succesfully logedout user');
            }
        });
    },

    /**
     * friend request accpet function
     */
    acceptFriendRequest: function (userID, requestUserid, date, status, type, next) {

        var sqlQuery = 'Update addfriend SET status = $4, requestacceptedate=$3, type=$5, isarchived=true where (useridby=$2 and useridto=$1)';
        var sqlQueryUpdateArchive = 'DELETE from addfriend where (useridby=$1 and useridto=$2)';

        db.getPg().query(sqlQuery, [userID, requestUserid, date, status, type], function (err, result) {

            if (err) {
                next(false);
            }
            else {
                db.getPg().query(sqlQueryUpdateArchive, [userID, requestUserid], function (err, result) {
                    if (err) {
                        next(false);
                    }
                    else next(true);
                });
            }
        });
    },

    /**
     * friend request reject function
     */
    rejectFriendRequest: function (userID, requestUserid, status, next) {
        var sqlQuery = 'DELETE FROM addfriend where useridby=$2 and useridto=$1 and status=$3'
        // var sqlQuery = 'Update addFriend SET status = $4, requestrejectedate=$3 ';
        db.getPg().query(sqlQuery, [userID, requestUserid, status], function (err, result) {
            if (err) {
                next(false);
            }
            else next(true);
        });
    },

    /**
     * removing friend from friend list
     */
    removeFriend: function (userID, requestUserid, date, status, next) {

        var sqlQuery = 'Update addFriend SET status = $4, requestrejectedate=$3 where useridby=$1 and useridto=$2';
        db.getPg().query(sqlQuery, [userID, requestUserid, date, status], function (err, result) {
            if (err) {
                next(false);
            }
            else next(true);
        });
    },

    /**
     * block user by user
    */
    blockUserByUser: function (userID, blocktoID, date, status, next) {
        if (status) {
            var sqlQuery = 'UPDATE addfriend SET isblocked= true where useridby=$1 and useridto=$2';
            db.getPg().query(sqlQuery, [userID, blocktoID], function (err, result) {
                if (err) {
                    next(false);
                }
                else next(true);
            });
        } else {
            var sqlQuery = 'INSERT INTO addfriend (useridby, useridto, blockedate, isblocked) values ($1, $2, $3, true)';
            db.getPg().query(sqlQuery, [userID, blocktoID, date], function (err, result) {
                if (err) {
                    next(false);
                }
                else next(true);
            });
        }
    },

    /**
     * unblock user by user
     */
    unBlockUserByUser: function (userID, blocktoID, date, next) {
        var sqlQuery = 'UPDATE addfriend SET isblocked= false where useridby=$1 and useridto=$2';
        db.getPg().query(sqlQuery, [userID, blocktoID], function (err, result) {
            if (err) {
                next(false);
            }
            else next(true);
        });
    },

    /**
    * check user exist or not w/r/t blockedid 
    */
    checkIfUserExistInAddFriend: function (userID, blockedto, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM addfriend WHERE blockedby=$1 and blockedto=$2", [userID, blockedto], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
     * get blocked user list function 
     */
    getBlockedUserListForUser: function (userID, next) {

        var sqlQuery = "SELECT * FROM users WHERE id!=$1 AND EXISTS (SELECT * FROM addfriend WHERE addfriend.useridby =$1 and addfriend.useridto= users.id and isblocked=true)";

        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * getUsersChatList
     */
    getUsersChatList: function (userID, next) {
        // get chat with userID
        //var sqlQuery = "SELECT msgbyid, msgtoid FROM (SELECT msgbyid, msgtoid FROM friendschat WHERE (msgtoid=$1 or msgbyid=$1) ORDER BY createdat DESC) as foo group by msgtoid,msgbyid";
        var sqlQuery = "SELECT msgbyid, msgtoid FROM friendschat WHERE (msgtoid=$1 or msgbyid=$1) ORDER BY createdat DESC";

        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
     /**
     * getUsersChatList
     */
    getUsersChatListBadges: function (userID, next) {
        // get chat with userID
        var sqlQuery = "SELECT msgbyid, msgtoid FROM (SELECT msgbyid, msgtoid FROM friendschat WHERE (msgtoid=$1 or msgbyid=$1) ORDER BY createdat DESC) as foo group by msgtoid,msgbyid";
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    /**
     * getChatListByUserID function
     */
    getChatListByUserID: function (userID, msgbyid, msgtoid, next) {
        // get chat with userID
        var sqlQuery = '';
        if (userID == msgbyid) {
            sqlQuery = "SELECT users.id, users.username, users.name, users.userprofilepictureurl, friendschat.* FROM friendschat left join users on friendschat.msgtoid = users.id WHERE (friendschat.msgtoid=$2 and friendschat.msgbyid=$1) OR (friendschat.msgtoid=$1 and friendschat.msgbyid=$2) ORDER BY friendschat.createdat DESC LIMIT 1";
        } else {
            sqlQuery = "SELECT users.id, users.username, users.name, users.userprofilepictureurl, friendschat.* FROM friendschat left join users on friendschat.msgbyid = users.id WHERE (friendschat.msgtoid=$2 and friendschat.msgbyid=$1) OR (friendschat.msgtoid=$1 and friendschat.msgbyid=$2) ORDER BY friendschat.createdat DESC LIMIT 1";
        }

        db.getPg().query(sqlQuery, [msgbyid, msgtoid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                var msgbyidup = msgtoid;
                if(userID != msgbyid){
                    msgbyidup = msgbyid;
                }
                var unseenQuery = "SELECT count(*) FROM friendschat WHERE msgbyid=$1 and msgtoid=$2 and isseen=false";
                db.getPg().query(unseenQuery, [msgbyidup, userID], function (err, unseen) {
                    if (err) {
                        next(false);
                    }else {
                        result.rows[0]['total_unseen'] = unseen.rows[0].count;
                        var sharedQuery = "SELECT count(*) FROM friendschat WHERE msgbyid=$1 and msgtoid=$2 and is_shared=true";
                        db.getPg().query(sharedQuery, [msgbyidup, userID], function (err, is_shared) {
                            if (err) {
                                next(false);
                            }else {
                                result.rows[0]['is_shared'] = (is_shared.rows[0].count != 0)? true : false;
                                next(result.rows);
                            }
                        });
                    }
                });
                //next(result.rows);
            }
        });
    },

    /**
    * getAllMsgOfUserId function
    */
    getAllMsgOfUserId: function (msgbyid, msgtoid, next) {
        var sqlQuery = "SELECT msgvalue, isseen, createdat FROM friendschat WHERE (msgtoid=$2 and msgbyid=$1) ORDER BY createdat DESC";
        db.getPg().query(sqlQuery, [msgbyid, msgtoid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get chat between two users
     */
    getChatBetweenTwoUsers: function (msgbyid, msgtoid, userID, next) {

        var sqlQuery = "SELECT users.id, users.username, users.name, users.userprofilepictureurl, friendschat.* FROM friendschat left join users on friendschat.msgbyid = users.id WHERE (msgtoid=$2 and msgbyid=$1) ORDER BY createdat DESC LIMIT 1";
        var sqlQueryUser = "SELECT users.id, users.username, users.name, users.userprofilepictureurl, friendschat.* FROM friendschat left join users on friendschat.msgtoid = users.id WHERE (msgtoid=$2 and msgbyid=$1) ORDER BY createdat DESC LIMIT 1";
        db.getPg().query(sqlQuery, [msgbyid, msgtoid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                if (msgbyid == userID) {
                    db.getPg().query(sqlQueryUser, [msgbyid, msgtoid], function (err, result) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(result.rows);
                        }
                    });
                } else {
                    next(result.rows);
                }
            }
        });
    },

    /**
     * getCheckPersonalChat function
     */
    getCheckPersonalChat: function (userID, msgby, next) {
        var sqlQuery = "SELECT count(*) FROM friendschat WHERE (msgtoid=$2 and msgbyid=$1) OR (msgtoid=$1 and msgbyid=$2)";
        db.getPg().query(sqlQuery, [userID, msgby], function (err, res) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0].count);
            }
        });
    },

    /**
     * update isshare status function
     */
    updateShareStatusPersonalChat: function (userID, msgby, next) {
        var sqlQueryUpdate = 'UPDATE friendschat SET is_shared=true where msgtoid=$2 and msgbyid=$1';
        db.getPg().query(sqlQueryUpdate, [userID, msgby], function (err, res) {
            if (err) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
     * getPersonalChat function
     */
    getPersonalChat: function (userID, msgby, status, next) {
        /**
         * update to isseen false to true
         */
        var sqlQueryUpdate = 'UPDATE friendschat SET isseen=true where msgtoid=$1 and msgbyid=$2';

        var sqlQuery = "SELECT * FROM friendschat WHERE (msgvalue != '' or url != '') and ((msgtoid=$2 and msgbyid=$1) OR (msgtoid=$1 and msgbyid=$2))";
        db.getPg().query(sqlQueryUpdate, [userID, msgby], function (err, res) {
            if (err) {
                next(false);
            }
            else {
                db.getPg().query(sqlQuery, [userID, msgby], function (err, result) {
                    if (err) {
                        next(false);
                    }
                    else {
                        next(result.rows);
                    }
                });
            }
        });
    },

    /**
     * send message function
     */
    sendMsgToOtherUser: function (userID, msgby, chat, date, imgUrl,isshared=false, next) {
        // get chat with both id's
        var sqlQuery = "INSERT INTO friendschat (msgbyid, msgtoid, msgvalue, createdat, url, is_shared) values ($1, $2, $3, $4, $5,$6)  RETURNING chatid AS chatID";
        db.getPg().query(sqlQuery, [userID, msgby, chat, date, imgUrl, isshared], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    /**
     * getPostsForMe function
     */
    getPostsForMe: function (userID,selectedUserID, next) {
        if(selectedUserID){
            var sqlQuery = "SELECT users.name, users.userprofilepictureurl, usersposts.* FROM usersposts left join users on usersposts.userid = users.id WHERE usersposts.postsharewith=$1 and usersposts.userid=$2 and usersposts.postexpired=false";
            db.getPg().query(sqlQuery, [userID,selectedUserID], function (err, result) {
                if (err) {
                    next(false);
                }
                else {
                    var sqlQueryUpdate = 'UPDATE friendschat SET is_shared=false where msgtoid=$1 and msgbyid=$2';
                    db.getPg().query(sqlQueryUpdate, [userID, selectedUserID], function (err, res) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(result.rows);
                        }
                    });
                    
                }
            });
        }else{
            var sqlQuery = "SELECT users.name, users.userprofilepictureurl, usersposts.* FROM usersposts left join users on usersposts.userid = users.id WHERE usersposts.postsharewith=$1 and usersposts.postexpired=false";
            db.getPg().query(sqlQuery, [userID], function (err, result) {
                if (err) {
                    next(false);
                }
                else {
                    next(result.rows);
                }
            });
        }
        
    },
    unreadedpostsforme: function (userID, next) {
        var totalSharedPostQuery = "select count(postid) FROM usersposts WHERE usersposts.postsharewith=$1 and usersposts.postexpired=false";
        var totalReadedPostQuery = "select count(postid) from usersactivityonpost where postid in (SELECT postid FROM usersposts WHERE usersposts.postsharewith=$1) and type = 'view' and  userid = $1";
        db.getPg().query(totalSharedPostQuery, [userID], function (err, totalSharedPost) {
            if (err) {
                next(false);
            }
            else {
                if(totalSharedPost.rows[0].count != 0){
                    db.getPg().query(totalReadedPostQuery, [userID], function (err, totalReadedPost) {
                        if (err) {
                            next(false);
                        }
                        else {
                            var unreadedPosts = Number(totalSharedPost.rows[0].count) - Number(totalReadedPost.rows[0].count);
                            next(unreadedPosts);
                        }
                    });
                }else{
                    next(totalSharedPost.rows[0].count);
                }
            }
        });
        
    },

    /**
     * commentOnPost function
     */
    commentOnPost: function (userID, postID, commentValue, type, next) {

        var sqlQuery = "INSERT INTO usersactivityonpost (userid, postid, commentvalue, type, commentid) values ($1, $2, $3, $4, $5)  RETURNING commentid AS commentid";
        var sqlQueryFindComment = "SELECT COUNT(*) AS count FROM usersactivityonpost";
        
        db.getPg().query(sqlQueryFindComment, function (er, commentsCount) {
            
            if (er) {
                next(false);
            }
            var count = ++commentsCount.rows[0].count;
            db.getPg().query(sqlQuery, [userID, postID, commentValue, type, count], function (err, result) {
                if (err) {
                    next(false);
                }
                else {
                    next(true);
                }
            });
        });

    },

    /**
     * commentOnPost function
     */
    ratingOnPost: function (userID, postID, commentValue, type, next) {
        var sqlQueryFindComment = "SELECT * FROM usersactivityonpost WHERE userid=$1 and postid=$2 and type=$3";
        var sqlQuery = "INSERT INTO usersactivityonpost (userid, postid, likevalue, type) values ($1, $2, $3, $4)  RETURNING id AS commentId";
        var sqlQueryUpdate = "UPDATE usersactivityonpost SET likevalue=$3 WHERE userid=$1 and postid=$2";

        db.getPg().query(sqlQueryFindComment, [userID, postID, type], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                if (result.rowCount != 0) {
                    db.getPg().query(sqlQueryUpdate, [userID, postID, commentValue], function (err, result) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(true);
                        }
                    });
                } else {
                    
                    db.getPg().query(sqlQuery, [userID, postID, commentValue, type], function (err, result) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(true);
                        }
                    });
                }
            }
        });
    },

    /**
     * delete comment from Post function
     */
    deleteCommentFromPost: function (userID, postID, next) {

        var sqlQuery = "UPDATE usersposts SET commentsvalue='' WHERE postsharewith=$1 and postid=$2 and commentedby=$1";
        db.getPg().query(sqlQuery, [userID, postID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
     * getCommentList function
     */
    getCommentList: function (userID, postId, next) {

        var sqlQuery = "SELECT users.name, users.userprofilepictureurl, usersactivityonpost.id, usersactivityonpost.userid, usersactivityonpost.postid, usersactivityonpost.commentid, usersactivityonpost.type, usersactivityonpost.commentvalue, usersactivityonpost.commentlikeby, usersactivityonpost.commentlikecount, usersactivityonpost.likevalue,  usersactivityonpost.createdat, usersactivityonpost.updatedat, usersactivityonpost.deletedat FROM usersactivityonpost left join users on usersactivityonpost.userid = users.id WHERE usersactivityonpost.type='comment' and usersactivityonpost.postid = $1";

        db.getPg().query(sqlQuery, [postId], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    
    /**
     * get like count on comment by commentID
     */
    getCommentslikecount: function (commentID, next) {

        var sqlQuery = "SELECT COUNT(*) AS count FROM usersactivityonpost WHERE commentid=$1 and iscommentlike=true";

        db.getPg().query(sqlQuery, [commentID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0].count);
            }
        });
    },

    /**
     * check comment like by me or not 
     */
    getCommentslikeByMe: function (commentID, userID, type, next) {

        var sqlQuery = "SELECT iscommentlike FROM usersactivityonpost WHERE commentid=$1 and userid=$2 and type=$3";

        db.getPg().query(sqlQuery, [commentID, userID, type], function (err, result) {
            
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0].iscommentlike);
            }
        });
    },

    /**
     * likeOnPost function
     */
    likeOnPost: function (userID, postID, likeValue, date, next) {

        var sqlQuery = "UPDATE usersposts SET likeby= $1, likeValue=$3, likedat=$4 WHERE postsharewith=$1 and postid=$2";
        db.getPg().query(sqlQuery, [userID, postID, likeValue, date], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
     * getListofLikeOnPost function
     */
    getListofLikeOnPost: function (postID, type, next) {

        var sqlQuery = "select * from usersactivityonpost where postid=$1 and type=$2";
        db.getPg().query(sqlQuery, [postID, type], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * getListofLikeOnComment function
     */
    getListofLikeOnComment: function (postId, type, next) {

        var sqlQuery = "select * from usersactivityonpost where commentid!=null and type=$2 and postid=$1";
        db.getPg().query(sqlQuery, [postId, type], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get Expried Post List function
     */
    getExpriedPostList: function (userid, next) {

        var sqlQuery = "select * from usersposts where postexpired=true and userid=$1";
        db.getPg().query(sqlQuery, [userid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get Expried Post detail function
     */
    getExpriedPostDetail: function (postId, next) {

        var sqlQuery = "select * from usersposts where postexpired=true and postid=$1";
        db.getPg().query(sqlQuery, [postId], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows);
            }
        });
    },

    /**
     * get Expried Post List which is not shared function
     */
    getExpriedPostNotSharedList: function (userid, next) {
        var sqlQuery = "select * from usersposts where postexpired=true and userid=$1 and postid in(select postid from usersposts where parentid =0)";
        db.getPg().query(sqlQuery, [userid], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    /**
     * getListofLikeOnComment by commentID
     */
    getListofLikeOnCommentByCommentID: function (commentId, type, next) {

        var sqlQuery = "select * from usersactivityonpost where commentid!=$1 and type=$2";
        db.getPg().query(sqlQuery, [commentId, type], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    /**
     * commentlike function
     */
    likeOnComment: function (userID, commentId, likeValue, type, next) {

        var sqlQueryFindComment = "SELECT * FROM usersactivityonpost WHERE commentlikeby=$1 and commentid=$2";
        var sqlQuery = "INSERT INTO usersactivityonpost (commentlikeby, commentid, iscommentlike, userid, type) values ($1, $2, $3, $4, $5) RETURNING id AS commentId";
        var sqlQueryUpdate = "UPDATE usersactivityonpost SET iscommentlike=$3, userid=$4, type=$5 WHERE commentlikeby=$1 and commentid=$2";

        db.getPg().query(sqlQueryFindComment, [userID, commentId], function (err, result) {
            if (err) {
                next(false);
            }
            else {

                if (result.rowCount != 0) {
                    db.getPg().query(sqlQueryUpdate, [userID, commentId, likeValue, userID, type], function (err, result) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(true);
                        }
                    });
                } else {
                    db.getPg().query(sqlQuery, [userID, commentId, likeValue, userID, type], function (err, result) {
                        if (err) {
                            next(false);
                        }
                        else {
                            next(true);
                        }
                    });
                }
            }
        });
    },
    /**
     * unLikePost function
     */
    unLikePost: function (userID, postID, next) {

        var sqlQuery = "UPDATE usersposts SET likeValue='', WHERE postsharewith=$1 and postid=$2 and likeby= $1";
        db.getPg().query(sqlQuery, [userID, postID], function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    /**
    * getPostsOfMe function
    */
    getPostsOfMe: function (userID, next) {
        // select addfriend.status, addfriend.isblocked, users.id, users.name, users.email, users.username, users.gender, users.userprofilepictureurl from users left join addfriend on users.id= addfriend.useridto and addfriend.useridby=$1 where users.id != $1"
        var sqlQuery = "SELECT * from usersposts WHERE userid=$1";
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },

    /**
     * get post viewer list
     */
    getPostViewerList: function (postId, type, next) {
        var sqlQuery = "SELECT users.name, users.country, users.userprofilepictureurl, usersactivityonpost.id, usersactivityonpost.userid, usersactivityonpost.postid, usersactivityonpost.type, usersactivityonpost.createdat, (SELECT uaop.likevalue FROM usersactivityonpost as uaop WHERE uaop.postid = $1 and uaop.userid = usersactivityonpost.userid and uaop.type = 'likeonpost' ORDER BY id DESC) as likes FROM usersactivityonpost left join users on usersactivityonpost.userid = users.id WHERE usersactivityonpost.postid = $1 and usersactivityonpost.type = $2;"
        db.getPg().query(sqlQuery, [postId, type], function (err, result) {
            if (err) {
                next(false);
            }
            else {
               next(result.rows);
            }
        });
    },

    addPostReport: function (senderUserID, postId, date, next) {
        var sqlQuery = 'INSERT INTO userspostsreports (postid, userid, createdat) values ($1, $2, $3)';
        db.getPg().query(sqlQuery, [postId, senderUserID, date], function (err, result) {
            if (err) {
                next(false);
            }else{
                next(true);
            }
        });
    },
    /**
     * get post viewer list
     */
    getPostViewerLike: function (postId, type, next) {
        var likeonpostQuery = "SELECT likevalue FROM usersactivityonpost WHERE postid = $1 and type = $2 ORDER BY id DESC";
        db.getPg().query(likeonpostQuery, [postId, type], function (err, likeonposts) {
            if (err) {
                next(false);
            }else {
                if(likeonposts.rows[0]){
                    var totalLikes = 0;
                    var totalPersonLike = 0;
                    likeonposts.rows.forEach(async (likeonpost,i) => {
                        totalLikes = parseInt(likeonpost.likevalue) + parseInt(totalLikes);
                        totalPersonLike = 1 + totalPersonLike;
                        if(likeonposts.rows.length - 1 == i){
                            next(totalLikes/totalPersonLike);
                        }
                    });
                }else{
                    next(0);
                }
            }
        });
    },
    /**
     * forgot password function as a update password
     */
    updatePassword: function (email, hash, next) {
        var sqlQuery = "UPDATE users SET password=$2 WHERE email=$1";
        db.getPg().query(sqlQuery, [email, hash], function (err, result) {
            if (err) {
                next(false);
            } else {
                next("password updated successfully");
            }
        });

    },

    /**
     * update user profile function 
     */
    updateUserProfile: function (userid, name, gender, imgUrl, next) {
        var sqlQuery = "UPDATE users SET name=$2, gender=$3, userprofilepictureurl=$4  WHERE id=$1";
        db.getPg().query(sqlQuery, [userid, name, gender, imgUrl], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });

    },
    
    /**
     * get post details
     */
    getPostDetails: function (postId, userId, next) {
        var sqlQuery = "SELECT usersposts.*,users.username,users.name,users.id,users.userprofilepictureurl, EXISTS(select id from usersactivityonpost where usersactivityonpost.userid=$2 and usersactivityonpost.postid = usersposts.postid and usersactivityonpost.type='view') as is_viewed from usersposts left join users on users.id=usersposts.parentuserid where usersposts.postid=$1 and usersposts.postsharewith=$2 and usersposts.postexpired=false";
        db.getPg().query(sqlQuery, [postId, userId], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows);
            }
        });

    },
    

    /**
     * get post details
     */
    getPostById: function (postId, next) {

        var sqlQuery = "SELECT * from usersposts where postid=$1";

        db.getPg().query(sqlQuery, [postId], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows);
            }
        });
    },
    /**
     * get post view count
     */
    getPostViewCount: function (postId, next) {
        var sqlQuery = "SELECT COUNT(*) AS count FROM usersposts WHERE postid=$1";
        db.getPg().query(sqlQuery, [postId], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows[0].count);
            }
        });

    },
    /**
     * get post view count
     */
    updatePostViewCount: function (postId, data, next) {
        var sqlQuery = "UPDATE usersposts SET postviewcount=$2 where postid=$1";
        db.getPg().query(sqlQuery, [postId, data], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });
    },
    /**
     * set post view post view count
     */
    updatePostViewCount: function (postId, data, next) {
        var sqlQuery = "UPDATE usersposts SET postviewcount=$2 where postid=$1";
        db.getPg().query(sqlQuery, [postId, data], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });
    },
    /**
     * get all post
     */
    getPosts: function (next) {
        var sqlQuery = "SELECT * from usersposts";
        db.getPg().query(sqlQuery, function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows);
            }
        });

    },
    getNotExpiredPosts: function (next) {
        var sqlQuery = "SELECT * from usersposts where postexpired=false and postexpiredat IS NULL ORDER BY postid DESC";
        db.getPg().query(sqlQuery, function (err, result) {
            if (err) {
                next(false);
            } else {
                next(result.rows);
            }
        });

    },

    /**
     * update post status to expired
     */
    updatePostStatusToExpired: function (postId, date, next) {
        var sqlQuery = "UPDATE usersposts SET postexpired=true, postexpiredat=$2 WHERE postid=$1";
        db.getPg().query(sqlQuery, [postId, date], function (err, result) {
            if (err) {
                next(false);
            } else {
                next(true);
            }
        });

    },
    /**
    * update post viewer list
   */
    updateViewerList: function (userID, type, postId, next) {

        var sqlQuery = 'INSERT INTO usersactivityonpost (userid, type, postid) values ($1, $2, $3)';
        db.getPg().query(sqlQuery, [userID, type, postId], function (err, result) {
            if (err) {
                next(false);
            }
            else next(true);
        });
    },
    /**
    * check user exist or not w/r/t emailID
    */
    isViewerExist: function (userId,postId, type, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM usersactivityonpost WHERE userid=$1 and postid=$2 and type=$3", [userId, postId,type], function (err, result) {
            if (err || result.rows[0].count == 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    // getuserByUserName
    getuserByUserName: function (username, next) {
        db.getPg().query("SELECT * FROM tbl_user WHERE username=$1", [username], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(null);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // check user is valid or not
    checkIsUserValid: function (userID, next) {
        db.getPg().query("SELECT checkIsUserValid($1) as passed", [userID], function (err, result) {
            if (err || !result.rows[0].passed) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    // check username is exist or not
    checkIfUserNameExist: function (username, next) {
        db.getPg().query("SELECT COUNT(*) AS count FROM users WHERE username=$1", [username], function (err, result) {
            if (err || result.rows[0].count <= 0) {
                next(false);
            }
            else {
                next(true);
            }
        });
    },

    // get user object email
    getUserObjectByEmail: function (email, next) {
        db.getPg().query("SELECT * FROM users where email=$1", [email], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // get user object email
    getUserObjectByEmailAdmin: function (email, next) {
        db.getPg().query("SELECT * FROM tbladmin where email=$1", [email], function (err, result) {
            if (err || result.rows.length == 0) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // getUserObjectByEmailAdmin
    getUserObjectByEmailAdmin: function (email, next) {
        db.getPg().query("SELECT * FROM tbladmin where email=$1", [email], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // get user object by username
    getUserObjectByUsername: function (username, next) {
        db.getPg().query("SELECT * FROM users where username=$1", [username], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    // getBlockedUserListForUser
    getBlockedUserList: function (next) {
        db.getPg().query("SELECT * FROM users where isblocked=true", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    // getActiveUserList
    getActiveUserList: function (next) {
        db.getPg().query("SELECT * FROM users where isblocked=false", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    // getReportedPostsList
    getReportedPostsList: function (next) {
        db.getPg().query("SELECT * FROM usersposts where isreported=true", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows);
            }
        });
    },
    // get perticular user posts
    getUserPostByID: function (user_id, next) {
        db.getPg().query("SELECT * FROM tbl_user_posts WHERE user_id=$1", [user_id], function (err, result) {
            if (err || result.rows[0].id == null) {
                next(null);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    // // createUserAdmin
    // createUserAdmin: function (name, email, password, gender, next) {

    //     try {
    //         var sqlQuery = "INSERT INTO tbl_admin(name, email, password, gender) VALUES ($1, $2, $3, $4)";
    //         db.getPg().query(sqlQuery, [name, email, password, gender], function (err, result) {
    //             if (err) {
    //                 next(0);
    //             } else {
    //                 next("User created successfully");
    //             }
    //         });
    //     } catch (err) {
    //         next(err);
    //     }
    // },

    //  block user  as a permanenet or temp
    blockUser: function (userID, status, blocked_at, next) {
        var sqlQuery = 'Update users SET isblocked = true, blockedtype=$2 , blockedat=$3 where id=$1';
        db.getPg().query(sqlQuery, [userID, status, blocked_at], function (err, result) {
            if (err) {
                next(false);
            }
            else next("User blocked successfully");
        });
    },

    // soft Delete post
    deletePost: function (postId, next) {
        var chekingparent = 'select parentid from usersposts where postid=$1';
        db.getPg().query(chekingparent, [postId], function (err, parent) {
            if (err) {
                next(false);
            } else { 
                if(parent.rows && parent.rows[0].parentid != 0){
                    var chekingparent1 = 'select distinct parentid,postid from usersposts where postid=$1 or parentid=$1';
                    db.getPg().query(chekingparent1, [parent.rows[0].parentid], function (err, parent1) {
                        if (err) {
                            next(false);
                        } else {
                            let getParentids = parent1.rows.map(a => a.parentid);
                            let getPostids = parent1.rows.map(a => a.postid);
                            var getGenrations = _.union(getParentids,getPostids);
                            var getGenrations = getGenrations.filter(function(value, index, arr){
                                return value > 0;
                            });
                            if(getGenrations){
                                var chekingparent2 = 'select distinct parentid,postid from usersposts where postid IN ('+getGenrations.toString()+') or parentid IN ('+getGenrations.toString()+')';
                                db.getPg().query(chekingparent2, null, function (err, parent2) {
                                    if (err) {
                                        next(false);
                                    }else{
                                        let getParentids2 = parent2.rows.map(a => a.parentid);
                                        let getPostids2 = parent2.rows.map(a => a.postid);
                                        var getGenrations1 = _.union(getParentids2,getPostids2);
                                        var getGenrations1 = getGenrations1.filter(function(value, index, arr){
                                            return value > 0;
                                        });
                                        var sqlQuery = 'delete from usersposts where postid IN ('+getGenrations1.toString()+') or parentid IN ('+getGenrations1.toString()+')';
                                            db.getPg().query(sqlQuery, [parent1.rows[0].parentid], function (err, result) {
                                        });
                                        var sqlQuery = 'delete from usersposts where postid IN ('+getGenrations.toString()+') or parentid IN ('+getGenrations.toString()+')';
                                            db.getPg().query(sqlQuery, [parent1.rows[0].parentid], function (err, result) {
                                        });
                                        var sqlQuery = 'delete from usersposts where parentid=$1';
                                            db.getPg().query(sqlQuery, [postId], function (err, result) {
                                        });
                                        var sqlQuery = 'delete from usersposts where postid=$1 or parentid=$1';
                                            db.getPg().query(sqlQuery, [parent.rows[0].parentid], function (err, result) {
                                        });
                                    }

                                });
                            }else{
                                var sqlQuery = 'delete from usersposts where postid=$1 or parentid=$1';
                                    db.getPg().query(sqlQuery, [parent.rows[0].parentid], function (err, result) {
                                });
                            }
                        }
                    });
                }
                var sqlQuery = 'select postid from usersposts where parentid=$1';
                db.getPg().query(sqlQuery, [postId], function (err, childs) {
                    if (err) {
                        next(false);
                    } else {
                        let gets = childs.rows.map(a => a.postid);
                        var chekingparent1 = 'select distinct postid,parentid from usersposts where postid IN ('+gets.toString()+') or parentid IN ('+gets.toString()+')';
                        db.getPg().query(chekingparent1, null, function (err, childs1) {
                            if (err) {
                                next(false);
                            } else {
                                let getchildsParentids = parent1.rows.map(a => a.parentid);
                                let getchildsPostids = parent1.rows.map(a => a.postid);
                                var getGenrations = _.union(getchildsParentids,getchildsPostids);
                                var getGenrations = getGenrations.filter(function(value, index, arr){
                                    return value > 0;
                                });
                                if(getGenrations){
                                    var sqlQuery = 'delete from usersposts where postid IN ('+getGenrations.toString()+') or parentid IN ('+getGenrations.toString()+')';
                                        db.getPg().query(sqlQuery, null, function (err, result) {
                                    });
                                    var sqlQuery = 'delete from usersposts where postid IN ('+gets.toString()+') or parentid IN ('+gets.toString()+')';
                                        db.getPg().query(sqlQuery, null, function (err, result) {
                                    });
                                }
                            }
                        });
                    }
                });
                var sqlQuery = 'delete from usersposts where parentid=$1';
                    db.getPg().query(sqlQuery, [postId], function (err, result) {
                });
                var sqlQuery = 'delete from usersposts where postid=$1';
                    db.getPg().query(sqlQuery, [postId], function (err, result) {
                });
                                        
                next("Post Deleted successfully");
            }
        });
        
    },

    //  unblock user which are blocked for temp
    unBlockUser: function (userID, status, next) {
        var sqlQuery = 'Update users SET isblocked = false where id=$1';
        db.getPg().query(sqlQuery, [userID], function (err, result) {
            if (err) {
                next(false);
            }
            else next("User unblocked successfully");
        });
    },

    // uploadUserProfilePicture
    uploadUserProfilePicture: function (email, imgUrl, next) {

        var sqlQuery = "UPDATE tbl_user SET user_profile_picture=$2 WHERE email=$1";
        db.getPg().query(sqlQuery, [email, imgUrl], function (err, result) {
            if (err) {
                next(0);
            } else {
                next("Profile picture uploaded successfully");
            }
        });
    },
    // updateReportedPostStatus
    updateReportedPostStatus: function (postID, reported_user_id, time, next) {

        var sqlQuery = "UPDATE usersposts SET isreported=true, reporteduserid=$2, reportedat=$3 WHERE postid=$1";
        db.getPg().query(sqlQuery, [postID, reported_user_id, time], function (err, result) {
            if (err) {
                next(false);
            } else {
                next("Post has been successfully reported");
            }
        });
    },

    // user login
    userLogin: function (email, password, next) {
        var sqlQuery = 'SELECT * from tbl_user WHERE email=$1';
        db.getPg().query(sqlQuery, [email], function (err, result) {
            if (err || result.rows[0].userID <= 0) {
                next(false);
            }
            else next(true);
        });
    },

    // get user count
    getUsersCount: function (next) {
        db.getPg().query("SELECT COUNT(*) as count FROM users", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // get blocked user count
    getBlockedUsersCount: function (next) {

        db.getPg().query("SELECT COUNT(*) as count FROM users where isblocked=true", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    // get blocked user count
    getActiveUsersCount: function (next) {
        db.getPg().query("SELECT COUNT(*) as count FROM users where isblocked=false", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },
    // getReportedPostsCount
    getReportedPostsCount: function (next) {
        db.getPg().query("SELECT COUNT(*) as count FROM usersposts where isreported=true", function (err, result) {
            if (err) {
                next(false);
            }
            else {
                next(result.rows[0]);
            }
        });
    },

    setPassword: function (token, password, next) {
        var sqlQuery = 'UPDATE tbl_user SET password=$2 WHERE token= $1';
        db.getPg().query(sqlQuery, [token, password], function (err, result) {
            if (err) {
                next(false);
            }
            else next(true);
        })
    },
}