app.service('forgotPasswordService', ['apiCalls', function (apiCalls) {

	this.forgotPassword = function(email) {
		return apiCalls.forgotPassword(email);
	};

	this.resetPassword = function(password) {
		return apiCalls.resetPassword(password);
	};

	this.resetPasswordProfile = function(oldPassword, password) {
		return apiCalls.resetPasswordProfile(oldPassword, password);
	};

}]);



