
app.service('dashboardService', ['apiCalls', function (apiCalls) {

	this.getUsersCount = function(){
		return apiCalls.getUsersCount();
	};

	this.getBlockedUsersCount = function(){
		return apiCalls.getBlockedUsersCount();
	};

	// getActiveUsersCount
	this.getActiveUsersCount = function(){
		return apiCalls.getActiveUsersCount();
	};
	// getReportedPostsCount
	this.getReportedPostsCount = function(){
		return apiCalls.getReportedPostsCount();
	};
}]);