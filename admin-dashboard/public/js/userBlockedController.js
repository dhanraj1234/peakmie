
app.controller('activeController', function activeController($scope, activeService){

	$scope.userList = activeService.getUserList();
	$scope.selectedUser = null;
	
	$scope.getBlockedUserList = function() {
		activeService.getBlockedUserList().then(function(response) {
			$.each(response.userData, function(i, key){
				$scope.userList.push(createUser(key));
			});
			if($scope.userList.length > 0)
				$scope.changeSelectedUser($scope.userList[0]);
			else $scope.changeSelectedUser(null);
		});
	};
	$scope.changeSelectedUser = function(user){
		$scope.selectedUser = user;
	}
	
	// one time calls to get data
	$scope.getBlockedUserList();

});

