angular.module("mis").controller("CartCtrl", ["$scope", "EventBus", function ($scope, EventBus) {
	$scope.goodsList = [];
	$scope.price = 0;

	EventBus.on("purchase", function(evt) {
		$scope.goodsList = evt.data;

		var price = 0;
		angular.forEach($scope.goodsList, function(item) {
			price += item.number * item.price;
		});
		$scope.price = price;
	});
}]);