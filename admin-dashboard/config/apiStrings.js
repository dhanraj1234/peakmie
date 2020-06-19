var NODE_ENV =  process.env.NODE_ENV;
var userApiUrl = "http://peakmie.dmlabs.in:1416/";

if(NODE_ENV == "production"){
	userApiUrl = "http://peakmie.dmlabs.in:1416/";
}

module.exports = {

	// api strings for dashbord status
	getUsersCount: userApiUrl + "get/usersCount",
	getBlockedUsersCount: userApiUrl + "get/blockedUsersCount",
	getActiveUsersCount: userApiUrl + "get/getActiveUsersCount",
	getReportedPostsCount: userApiUrl + "get/getReportedPostsCount",

	// api strings for user management
	checkUserExistsUri: userApiUrl + "get/checkIfUserExist",
	createNewUserUri: userApiUrl + "put/createUser",
	createTokenUri: userApiUrl + "put/createToken",
	getUserObjByEmailUri: userApiUrl + "get/userObjectByEmailAdmin",
	getUserObjByTokenUri: userApiUrl + "get/userObjectByToken",
	getUserObjByTokenUriForgotPassword: userApiUrl + "get/userObjectByTokenForgotPassword",
	getUserObjUri: userApiUrl + "get/userObject",
	getAdminUserObjUri: userApiUrl + "get/adminuserObject",
	isTokenValidUri: userApiUrl + "get/checkIsTokenValid",
	removeTokenUri: userApiUrl + "delete/token",
	updateUserProfileUri: userApiUrl + "put/updateUserProfile",
	getUserProfileUri: userApiUrl + "get/userProfile",
	getUserList: userApiUrl + "get/userList",
	getBlockedUserList: userApiUrl + "get/blockedUserList",
	getActiveUserList: userApiUrl + "get/getActiveUserList",
	getReportedPostsList: userApiUrl + "get/getReportedPostsList",
	blockUser: userApiUrl + "put/blockUser",
	deletePost: userApiUrl + "put/deletePost",

	// // forgot password Api
	// forgotPassword: userApiUrl + "put/forgot",
	// resetPasswordAuth: userApiUrl + "put/updatePassword",
	// resetPassword: userApiUrl + "put/resetPassword",
	// getUserObjByTokenUriForgotPassword: userApiUrl + "get/userObjectByTokenForgotPassword",

}