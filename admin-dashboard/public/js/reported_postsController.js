
app.controller('activeController', function activeController($scope, activeService, $sce){

	$scope.userList = activeService.getUserList();
	$scope.selectedUser = null;

	$scope.getReportedPostsList = function() {
		activeService.getReportedPostsList().then(function(response) {
			$.each(response.userData, function(i, key){
				$scope.userList.push(key);
			});
			if($scope.userList.length > 0)
				$scope.changeSelectedUser($scope.userList[0]);
			else $scope.changeSelectedUser(null);
		});
	};
	$scope.changeSelectedUser = function(user){
		$scope.selectedUser = user;
	}

	$scope.deletePost = function(postId){
		activeService.deletePost(postId).then(function(response){
			if(response.result == 'ok'){
				$.each($scope.userList, function(i, key){
					if(key.postid == postId){
						$scope.userList.splice(i, 1);
						if($scope.userList.length > 0)
							$scope.changeSelectedUser($scope.userList[0]);
						else $scope.changeSelectedUser(null);
						return false;
					}
				});
				alert("Reported post has been successfully removed from the system");
			}
			else alert("Unable to delete reported post from system");
		});
	};

	$scope.trustSrc = function(src) {
		return $sce.trustAsResourceUrl(src);
	}

	  
	// one time calls to get data
	$scope.getReportedPostsList();

});

