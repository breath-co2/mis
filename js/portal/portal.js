(function () {
	var app = angular.module('mis', []);

	app.config(function ($routeProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {
		app.controllerProvider = $controllerProvider;
		app.compileProvider = $compileProvider;
		app.routeProvider = $routeProvider;
		app.filterProvider = $filterProvider;
		app.provide = $provide;

		// Register routes with the $routeProvider
	});
})();

angular.module("mis").directive("appLoader", function ($http, $compile, $rootScope, $q, $controller) {
	return function (scope, element, attrs) {
		var url = attrs.url;
		var dependencies = attrs.scripts.split(",") || [];

		var deferred = $q.defer();
		// Load the dependencies
		$script(dependencies, function () {
			// all dependencies have now been loaded by so resolve the promise
			$rootScope.$apply(function () {
				deferred.resolve();
				$http.get(url).success(function (result) {
					element.html(result);


					var newScope = scope;

					var controller = $controller("Cart", {$scope:newScope});

					$compile(element.contents())(newScope);
				});
			});
		});
	};
});

angular.module("mis").controller("Portal", function ($scope, $rootScope) {
	$scope.$on("purchase", function(evt, arg) {

	});

	$scope.user = {
		name: "Xu.fei",
		age: 32
	};
});