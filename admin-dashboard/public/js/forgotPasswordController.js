app.controller('forgotPasswordController', function forgotPasswordController($scope, $window, forgotPasswordService, toaster){

	$scope.oldPassword= '';
	$scope.password='';
	$scope.confirmPassword='';
	$scope.email= '';

	$scope.forgotPassword = function(){
		forgotPasswordService.forgotPassword($scope.email).then(function(response) {
			console.log(response);
			if(response.result == 'ok'){
				toaster.pop('success', "Success", "We have sent you mail for with forgotPassword Details .");
			}
			else {
				toaster.pop('error', "Error", "Sorry User does not exist with this emailid.");
			}
		});
	};

	$scope.resetPassword = function(){
		forgotPasswordService.resetPassword($scope.password, $scope.confirmPassword).then(function(response, err) {
			if($scope.password == $scope.confirmPassword){
				toaster.pop('success', "Success", "Your password has been changed successfully. Redirecting to home page. Please login again.");
				setTimeout(function () {
					$window.location.href = '/';
				}, 5000);				
			}
			else {
				toaster.pop('error', "Error", "Sorry Your password does not match, Please reEnter it ");
			}
		});
	};

	
	$scope.resetPasswordProfile = function(){
		forgotPasswordService.resetPasswordProfile($scope.oldPassword, $scope.password, $scope.confirmPassword).then(function(response, err) {
			if (response.result != true) {
				toaster.pop('error', "Error", "Sorry your Old password not correct Please enter correct Password");				
			}
			else {
				if ($scope.password == $scope.confirmPassword) {
				toaster.pop('success', "Success", "Your password has been changed successfully");			
				}
				else {
					toaster.pop('error', "Error", "Sorry Your new password does not match with confirm password, Please reEnter it ");
				}
			}
		});
	};

});