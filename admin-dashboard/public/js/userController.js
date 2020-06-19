
app.controller('userController', function kycController($scope, userService){

	$scope.userList = userService.getUserList();
	$scope.selectedUser = null;

	$scope.getUserListFromServer = function() {
		userService.getUserListFromServer().then(function(response) {
			$.each(response.userList, function(i, key){
				$scope.userList.push(createUser(key));
			});
		});
	};

	// one time calls to get data
	$scope.getUserListFromServer();

});


