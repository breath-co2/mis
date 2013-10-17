angular.module("mis").controllerProvider.register("Goods", function ($scope, $rootScope) {
	$scope.numOfApple = 0;
	$scope.numOfOrange = 0;
	$scope.numOfPear = 0;

	$scope.submit = function() {
		$rootScope.$broadcast("purchase", [{
			type: "Apple",
			number: this.numOfApple,
			price: 5
		}, {
			type: "Orange",
			number: this.numOfOrange,
			price: 4
		}, {
			type: "Pear",
			number: this.numOfPear,
			price: 3
		}]);
	}
});