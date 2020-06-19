
app.controller('dashboardController', function dashboardController($scope, dashboardService){

	$scope.totalUsers = 0;
	$scope.blockedUsersCount = 0;
	$scope.activeUsersCount = 0;
	$scope.totalReportedPosts = 0;

	$scope.getUsersCount = function(){
		dashboardService.getUsersCount().then(function(response){
			$scope.totalUsers = response.usersCount.count;
		});
	};

	$scope.getBlockedUsersCount = function(){
		dashboardService.getBlockedUsersCount().then(function(response){
			$scope.blockedUsersCount = response.usersCount.count;
		});
	};

	$scope.getActiveUsersCount = function(){
		dashboardService.getActiveUsersCount().then(function(response){
			$scope.activeUsersCount = response.usersCount.count;
		});
	};

	$scope.getReportedPostsCount = function(){
		dashboardService.getReportedPostsCount().then(function(response){
			$scope.totalReportedPosts = response.usersCount.count;
		});
	};
	
	//  calling to functions 
	$scope.getUsersCount();
	$scope.getBlockedUsersCount();
	$scope.getActiveUsersCount();
	$scope.getReportedPostsCount();

});

