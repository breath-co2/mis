

mis.controller("Portal", function($scope, $http) {
	$scope.user = {
		name: "Xufei",
		age: 32
	};

	$scope.loadModule = function(html, js) {
		var htmlRequest = $http.get('FIRSTRESTURL', {cache: false});
		var jsRequest = [];

		angular.forEach(js, function(item) {
			jsRequest.push($http.get(item));
		});

		$q.all(jsRequest).then(function(values) {
			$scope.results = MyService.doCalculation(values[0], values[1]);
		});
	};
});