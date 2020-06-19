
app.service('apiCalls', function($http, $q) {	

    /**
     * Task- get all users count
     * req- GET
     * res- usersCount
     */
    this.getUsersCount = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getUsersCount"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };

    /**
     * Task- get blocked users count
     * req- GET
     * res- usersCount
     */
    this.getBlockedUsersCount = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getBlockedUsersCount"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };
    
    /**
     * Task- get Active users count
     * req- GET
     * res- usersCount
     */
    this.getActiveUsersCount = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getActiveUsersCount"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };
    
    /**
     * Task- get total posts count
     * req- GET
     * res- postsCount
     */
    this.getReportedPostsCount = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getReportedPostsCount"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };
    
    /**
     * Task- get toal active user list
     * req- GET
     * res- activeUserList
     */
    this.getActiveUserList = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getActiveUserList"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };
    
    /**
     * Task- get reported post list
     * req- GET
     * res- reportedPostsList
     */
    this.getReportedPostsList = function() {
        var deferred = $q.defer();

        $http({
                method: "GET",
                url: "/ajax/getReportedPostsList"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function (errResponse) {
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;		
    };
    
    /**
     * Task- update user status unblock to block
     * req- PUT
     * res- boolean
     */
    this.blockUser = function(user, status){
        var deferred = $q.defer();
        var data = {
            userID: user.id,
            userEmail: user.email,
            status: status,
        }
        $http.put("/ajax/blockUser", data)
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function(errResponse){
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;
    };

    this.deletePost = function(postId){
        var deferred = $q.defer();
        var data = {
            postId: postId,
        }
        $http.put("/ajax/deletePost", data)
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function(errResponse){
                    deferred.reject(errResponse);
                }
            );
        return deferred.promise;
    };

    /**
     * Task- get user list
     * req- GET
     * res- usersList
     */
    this.getUserListFromServer = function(){
        var deferred = $q.defer();
        
        $http({
                method: "GET",
                url: "/ajax/getUserList"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function(errResponse){
                    deferred.reject(errResponse);
                }
            );

        return deferred.promise;
    }

    /**
     * Task- get block user list
     * req- GET
     * res- blockedUserlist
     */
    this.getBlockedUserList = function(){
        var deferred = $q.defer();
        
        $http({
                method: "GET",
                url: "/ajax/getBlockedUserList"
            })
            .then(
                function (response) {
                    deferred.resolve(response.data);
                },
                function(errResponse){
                    deferred.reject(errResponse);
                }
            );

        return deferred.promise;
    }    
});


