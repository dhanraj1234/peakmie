
app.controller('activeController', function activeController($scope, activeService){

    $scope.userList = activeService.getUserList();
    $scope.selectedUser = null;
    
    $scope.getActiveUserList = function() {
        activeService.getActiveUserList().then(function(response) {
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

    $scope.blockUser = function(status){
        activeService.blockUser($scope.selectedUser, status).then(function(response){
            if(response.result == 'ok'){
                $.each($scope.userList, function(i, key){
                    if(key.id == $scope.selectedUser.id){
                        $scope.userList.splice(i, 1);
                        if($scope.userList.length > 0)
                            $scope.changeSelectedUser($scope.userList[0]);
                        else $scope.changeSelectedUser(null);
                        return false;
                    }
                });
                alert("User successfully has been blocked");

            }
            else alert("Unable to block user");
        });
    };

    // one time calls to get data
    $scope.getActiveUserList();

});

