angular.module("widgets", []);

angular.module("widgets").config(function ($controllerProvider) {
	angular.module("widgets").controller = $controllerProvider.register;
});

angular.module("widgets").controller("ClockCtrl", function($timeout, $scope) {
	$scope.now = new Date();
	updateLater();

	var timeoutId;
	function updateLater() {
		$scope.now = new Date();
		timeoutId = $timeout(function() {
			updateLater();
		}, 1000);
	}
});