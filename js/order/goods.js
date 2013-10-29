angular.module("order").controllerProvider.register("Goods", function ($scope, EventBus) {
	$scope.numOfApple = 0;
	$scope.numOfOrange = 0;
	$scope.numOfPear = 0;

	$scope.submit = function() {
		EventBus.fire({
			type:"purchase",
			data: [{
			type: "Apple",
			number: $scope.numOfApple,
			price: 5
		}, {
			type: "Orange",
			number: $scope.numOfOrange,
			price: 4
		}, {
			type: "Pear",
			number: $scope.numOfPear,
			price: 3
		}]});
	}
});