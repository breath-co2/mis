angular.module("mis").controllerProvider.register("Cart", function ($scope, $rootScope) {
	$scope.goodsList = [];

	$rootScope.$on("purchase", function(evt, arg) {
		$scope.goodsList = arg;

		var price = 0;
		angular.forEach(function(item) {
			price += item.number * item.price;
		});
		$scope.price = price;
	});
});