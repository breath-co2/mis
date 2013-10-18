angular.module("mis").controllerProvider.register("Cart", function ($scope, $rootScope) {
	$scope.goodsList = [];
	$scope.price = 0;

	$scope.$on("purchase", function(evt, arg) {
		$scope.goodsList = arg;

		var price = 0;
		angular.forEach($scope.goodsList, function(item) {
			price += item.number * item.price;
		});
		$scope.price = price;
	});
});