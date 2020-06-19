
app.service('userService', ['apiCalls', function (apiCalls) {

	var userList = [];

	this.getUserList = function(){
		return userList;
	};

	this.getUserListFromServer = function(){
		return apiCalls.getUserListFromServer();
	};
}]);