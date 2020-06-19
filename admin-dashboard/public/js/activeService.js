
app.service('activeService', ['apiCalls', function (apiCalls) {

	var userList = [];

	this.getUserList = function(){
		return userList;
	};

	this.getBlockedUserList = function(){
		return apiCalls.getBlockedUserList();
	};
	// getActiveUserList

	this.getActiveUserList = function(){
		return apiCalls.getActiveUserList();
	};
	// blockUser
	this.blockUser = function(user, status){
		return apiCalls.blockUser(user, status);
	};

	// getReportedPostsList
	this.getReportedPostsList = function(){
		return apiCalls.getReportedPostsList();
	};
	
	// delete Reported Posts
	this.deletePost = function(postId){
		return apiCalls.deletePost(postId);
	};
}]);