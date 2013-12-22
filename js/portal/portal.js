(function () {
	var app = angular.module("mis", []);

	app.config(function ($controllerProvider, $compileProvider, $filterProvider, $provide) {
		app.controllerProvider = $controllerProvider;
		app.compileProvider = $compileProvider;
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

angular.module("mis").service("ScriptLoader", ["http", "$q", function($http, $q) {
	var scriptMap = {};

	return {
		load: function(scripts, callback) {
			var requests = [];
			for (var i=0; i<scripts.length; i++) {
				if (!scriptMap[scripts[i]]) {
					requests.push($http.get(scripts[i]));
				}
			}

			$q.all(requests).then(function(results) {
				for (var j=0; j<results.length; j++) {
				}
				callback();
			});
		}
	};
}]);

angular.module("mis").directive("htmlLoader", ["$http", function ($http) {
	return function (scope, element, attrs) {
		var url = attrs.url;
		$http.get(url).success(function (result) {
			var newElement = angular.element(result);
			element.append(newElement);
		});
	};
}]);

angular.module("mis").directive("appLoader", ["$http", "$compile", function ($http) {
	return function (scope, element, attrs) {
		var module = attrs.module;
		var url = attrs.url;
		var scripts = attrs.scripts.split(",") || [];

		$script(scripts, function () {
			scope.$apply(function () {
				$http.get(url).success(function (result) {
					var elem = angular.element(result);
					angular.bootstrap(elem, [module]);
					element.append(elem);
				});
			});
		});
	};
}]);

angular.module("mis").directive("partialLoader", ["$http", "$compile", function ($http, $compile) {
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
}]);

angular.module("mis").controller("Portal", function ($scope) {
	$scope.user = {
		name: "Xu.fei",
		age: 32
	};
});

angular.module("mis").controller("ModuleCtrl", function ($scope) {
	$scope.modules = [
		{title: "1", url: "partial/include/1.html"},
		{title: "2", url: "partial/include/2.html"},
		{title: "3", url: "partial/include/3.html"}
	];

	var newModules = [
		{title: "Profile", url: "partial/profile.html"},
		{title: "Goods", url: "partial/goods.html"},
		{title: "Cart", url: "partial/cart.html"}
	];

	$scope.currentModule = $scope.modules[0];
	$scope.currentModule.selected = true;

	$scope.addModule = function () {
		if (newModules.length > 0) {
			var newModule = newModules.pop();
			$scope.modules.push(newModule);

			if ($scope.currentModule) {
				$scope.currentModule.selected = false;
			}

			$scope.currentModule = newModule;
			newModule.selected = true;
		}
	};

	$scope.switchModule = function (index) {
		var newModule = $scope.modules[index];

		if ($scope.currentModule) {
			$scope.currentModule.selected = false;
		}

		$scope.currentModule = newModule;
		newModule.selected = true;
	};

	$scope.closeModule = function (index) {
		if ($scope.currentModule === $scope.modules[index]) {
			$scope.currentModule.selected = false;
			$scope.currentModule = null;
		}

		$scope.modules.splice(index, 1);
	}
});

angular.module("mis").controller("Wizard", ["$scope", function ($scope) {
	$scope.steps = [
		{title: "Profile", url: "partial/profile.html", selected:true},
		{title: "Goods", url: "partial/goods.html", selected:false},
		{title: "Cart", url: "partial/cart.html", selected:false}
	];

	$scope.currentStep = 0;

	$scope.prev = function () {
		$scope.steps[$scope.currentStep].selected = false;
		$scope.currentStep--;
		$scope.steps[$scope.currentStep].selected = true;
	};

	$scope.next = function () {
		$scope.steps[$scope.currentStep].selected = false;
		$scope.currentStep++;
		$scope.steps[$scope.currentStep].selected = true;
	};

	$scope.isFirst = function () {
		return $scope.currentStep === 0;
	};

	$scope.isLast = function () {
		return $scope.currentStep === ($scope.steps.length-1);
	};
}]);