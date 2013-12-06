(function () {
	var app = angular.module("mis", []);

	app.config(function ($routeProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {
		app.controllerProvider = $controllerProvider;
		app.compileProvider = $compileProvider;
		app.routeProvider = $routeProvider;
		app.filterProvider = $filterProvider;
		app.provide = $provide;
	});
})();

angular.module("mis").service("EventBus", function () {
	var eventMap = {};

	return {
		on: function (eventType, handler) {
			//multiple event listener
			if (!eventMap[eventType]) {
				eventMap[eventType] = [];
			}
			eventMap[eventType].push(handler);
		},

		off: function (eventType, handler) {
			for (var i = 0; i < eventMap[eventType].length; i++) {
				if (eventMap[eventType][i] === handler) {
					eventMap[eventType].splice(i, 1);
					break;
				}
			}
		},

		fire: function (event) {
			var eventType = event.type;
			if (eventMap[eventType]) {
				for (var i = 0; i < eventMap[eventType].length; i++) {
					eventMap[eventType][i](event);
				}
			}
		}
	};
});

angular.module("mis").directive("htmlLoader", function ($http) {
	return function (scope, element, attrs) {
		var url = attrs.url;
		$http.get(url).success(function (result) {
			element.html(result);
		});
	};
});

angular.module("mis").directive("appLoader", function ($http) {
	return function (scope, element, attrs) {
		var module = attrs.module;
		var url = attrs.url;
		var scripts = attrs.scripts.split(",") || [];

		$script(scripts, function () {
			scope.$apply(function () {
				$http.get(url).success(function (result) {
					element.html(result);
					angular.bootstrap(element, [module]);
				});
			});
		});
	};
});

angular.module("mis").directive("partialLoader", function ($http, $compile) {
	return function (scope, element, attrs) {
		var module = attrs.module;
		var url = attrs.url;
		var scripts = attrs.scripts.split(",") || [];

		$script(scripts, function () {
			scope.$apply(function () {
				$http.get(url).success(function (result) {
					element.html(result);
					$compile(element.contents())(scope);
				});
			});
		});
	};
});

angular.module("mis").controller("Portal", function ($scope) {
	$scope.user = {
		name: "Xu.fei",
		age: 32
	};
});

angular.module("mis").controller("ModuleCtrl", function ($scope) {
	$scope.modules = [
		"partial/include/1.html",
		"partial/include/2.html",
		"partial/include/3.html"
	];

	$scope.newModules = [
		"partial/profile.html",
		"partial/goods.html",
		"partial/cart.html"
	];

	$scope.currentIndex = 0;

	$scope.loadPartial = function (index) {
		$scope.modules.push($scope.newModules[index]);
	};
});