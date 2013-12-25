基于AngularJS构建Web应用门户
====

在应用型的Web系统中，有很大一类是MIS系统，MIS全称是管理信息系统，代表着一大类传统软件，包括办公自动化，资源管理，业务受理，金融结算等各大方向。曾经这些系统都是C/S架构的，但是最近10年，大部分都迁移到B/S架构了。

对B/S系统的架构有很多文章谈，但一般都集中在后端架构，很少有谈前端的，更少细致深入谈前端架构的，这个系列文章，就是打算作一下尝试，对每个细节，也尽量会给一些具体实现方式的建议。

本文示例代码使用的框架为AngularJS，版本为1.2.5。

企业应用门户的设计，其实是一个很考验规划水准的事。因为它首先要集成别人的功能部件，还要考虑自己的功能部件如何被别人集成。它的设计思路直接影响到一大堆代码按照什么规范进行开发。挂在这个门户上的业务模块，有的很简单，不会影响别人，有的可能会影响别人，要想个办法把它隔离起来，还有的本身就要跟别人通讯。

我们看看一个典型的场景，一个工作台，或者说门户界面，上面能够放很多小部件，类似iGoogle那样，用户可以任意加已有的部件，这些部件都是基于某种约定，由第三方开发人员完成，该怎么实现呢？

#1. 异构的第三方部件

在B/S模式下，最简单的部件集成方式是iframe，每个功能部件都以iframe的方式被集成起来。这种方式是很简便，但有一些弊端，比如说，被集成的部件界面自身功能要完整，即使没有门户界面，它也要能运行起来，这就要求它自身就包含所依赖的库，这么一来，每个界面都加载了一套库，实际上这是公共的，没有必要每个界面都加载，网络传输这个可以通过缓存来解决，但每个库自己在当前页面构建的一套内存环境，是没法优化的。

所以，使用iframe来做集成，只适合那些异构系统，这种场景下，我们无法控制被集成方的代码编写方式，比如说要在门户里集成一个第三方的天气widget，基本只能通过这种方式。

这种集成的部件，如果有跟门户自身或者其他部件有通讯的需求，不考虑低端浏览器的话，一般可以用postMessage做，不管部件跟门户是否同域，都能够执行。

#2. 简单逻辑的HTML片段

如果部件的开发过程能够由我们控制，也就是说，可以由门户提供一些开发规范，让部件开发人员在这些规范的基础上进行开发，能够优化的地方就很多了。

一个部件，可以有界面、逻辑、样式，这些都可以分别动态加载出来，比如HTML片段可以ng-include或者$get过来append，js文件可以require，css可以行间也可以动态加rule，因为这些部件是要跟我们主界面在同一个页面作用域内，所以要尽量营造隔离的环境。我们从最简单的看起吧，先看只有界面的。

只有界面的情况很好办，它直接拿来放在某容器里就可以了，互相影响不到，在Angular里面直接搞个ng-include把它包含到主界面就可以了。

    <div ng-include src="'partial/simple.html'"></div>

simple.html的源码：

    <div class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">Simple HTML Loader</h3>
    	</div>
    	<div class="panel-body">
    		<span>I am a static HTML partial file.</span>
    	</div>
    </div>

好了，我们来看稍微复杂点的，引入的代码有了行间逻辑。什么是行间逻辑呢？意思是这一段JavaScript逻辑只作用于当前界面片段，出于某些原因，这些逻辑必须紧跟当前的界面，需要在全页面加载出来之前就能执行，比如某些搜索，只要搜索框一出来就应当能操作，这就是一种典型的需求。

简单起见，我们只在这个逻辑里放一个alert，只要能执行到，就算成功了。

inlinelogic.html

    <div class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">Simple HTML with inline logic</h3>
    	</div>
    	<div class="panel-body">
    		<input type="button" value="click me" onclick="greet()"/>
    		<script type="text/javascript">
    			function greet() {
    				alert("I am from inline logic!");
    			}
    		</script>
    	</div>
    </div>

还是这么写：

    <div ng-include src="'partial/inlinelogic.html'"></div>

唔？这次发现不能运行了。为什么呢？

本质原因，是把某HTML片段用innerHTML方式加入DOM的时候，如果其中带有JavaScript，这段代码不会被执行，但是如果有script标签，通过appendChild的方式加到DOM里，是可以执行的，这个过程用ng-include没法做，所以我们来自己写个指令：

    angular.module("mis").directive("htmlLoader", ["$http", function ($http) {
    	return function (scope, element, attrs) {
    		var url = attrs.url;
    		$http.get(url).success(function (result) {
    			var newElement = angular.element(result);
    
    			var scripts = newElement[0].getElementsByTagName("script");
    			var deferredScripts = [];
    			for (var i=0; i<scripts.length; i++) {
    				deferredScripts.push(scripts[i].parentElement.removeChild(scripts[i]));
    			}
    
    			element.append(newElement);
    			for (var j=0; j<deferredScripts.length; j++) {
    				var script = document.createElement("script")
    				script.innerHTML = deferredScripts[j].innerHTML;
    				newElement[0].appendChild(script);
    			}
    		});
    	};
    }]);

然后在使用的时候：

    <div html-loader url="partial/inlinelogic.html"></div>

再看看运行结果，已经可以了。我们的html loader指令也可以用于加载无逻辑的HTML片段，细节部分可能还有需要完善的，大致思路是这样。

#3. 同构的界面部件

什么是同构的界面部件呢？意思是这个部件的开发过程采用了与门户一样的开发技术和规范，在我们这里，就是指使用了Angular框架。

##3.1. 纯界面模板部件

我们知道，Angular框架中有controller，service等部分，对于一个部件来说，它可能有这些部分，也可能没有，如果没有的话，那是非常简单的，这时候这个界面部件就退化成界面模板，只需要用ng-include把这个部件引入到主界面中，就可以正常运行了。

这种情况，跟刚才第2节中提到的部分还是有区别的，差异在于，这个界面模板里可以带有一些Angular的模板语法，比如直接引用已经在主界面的$scope或者$rootScope上存在的变量，也可以使用已经被主界面加载过的controller和factory等定义。

举例来说，如果门户自带了一个用户模型，里面存放了用户的个人资料和相关操作，在部件里也是可以引入的，就像这样：

    <div class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">Greet</h3>
    	</div>
    	<div class="panel-body">
    		Hello  <span ng-bind="user.name"></span>
    	</div>
    </div>

这个界面被用ng-include的方式引入门户主界面就可以直接使用了。这是很简单的情况，我们再看看复杂一些的。

##3.2. 有独立命名空间的部件

我们知道，在一个复杂应用中编写JavaScript的话，最基本的常识就是避免全局变量，在Angular体系中，还需要作些特殊的考虑。我们知道，Angular里面，第一级组织单元是module，但它这个module的概念跟AMD那种module的不同，如果说AMD的module相当于Java Class的级别，Angular的要相当于package了。

假设有这么一个部件，它的逻辑拥有独立的命名空间，比如是一个时钟，它的module与门户的module毫无关系，代码如下：

clock.js

    angular.module("widgets", []);
    
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

另有一个界面用于展示:

clock.html

    <div ng-controller="ClockCtrl" class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">I am an external application!</h3>
    	</div>
    	<div class="panel-body" ng-bind="now"></div>
    </div>
    
很显然，我们刚才的html loader已经没法使它正常运行了，而用ng-include的方式，没法为它引入所依赖的js文件，也不能执行。如果把clock.js放在门户里加载，也不合适，因为门户需要独立于部件，不应有所依赖，这种情况怎么办呢？

我们来改进一下刚才的html loader，使得它具有载入js代码的功能，取名为app loader。

在Angular的多模块解决方案中，一般用$script来做JavaScript文件的异步加载，使用起来也非常简单，可以加载一个数组的js代码，然后执行一个回调函数。

我们期望的写法是这样，指定部件主界面模版的url，JavaScript代码路径，还有所在的模块，剩下的就是要在app loader这个directive里要做的事情了。

    <div app-loader url="partial/clock.html" module="widgets" scripts="js/widgets/clock.js"></div>

Angular的bootstrap函数可以用于把独立的ng-app初始化一遍，对于这种情况，正合适。

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
    
现在看起来，我们的加载方案很有点像样了。再继续考虑更复杂的情况。

比如说，我们还有个代办事宜的widget，但是它也是位于widgets命名空间下的，代码从Angular官网抄来：

todo.js

    angular.module("widgets", []);

    angular.module("widgets").controller("TodoCtrl", function ($scope) {
    	$scope.todos = [
    		{text:'learn angular', done:true},
    		{text:'build an angular app', done:false}];
    
    	$scope.addTodo = function() {
    		$scope.todos.push({text:$scope.todoText, done:false});
    		$scope.todoText = '';
    	};
    
    	$scope.remaining = function() {
    		var count = 0;
    		angular.forEach($scope.todos, function(todo) {
    			count += todo.done ? 0 : 1;
    		});
    		return count;
    	};
    
    	$scope.archive = function() {
    		var oldTodos = $scope.todos;
    		$scope.todos = [];
    		angular.forEach(oldTodos, function(todo) {
    			if (!todo.done) $scope.todos.push(todo);
    		});
    	};
    });

todo.html

    <div ng-controller="TodoCtrl" class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">I am an external application!</h3>
    	</div>
    	<div class="panel-body">
    		<span>{{remaining()}} of {{todos.length}} remaining</span>
    		[ <a href="" ng-click="archive()">archive</a> ]
    		<ul class="unstyled">
    			<li ng-repeat="todo in todos">
    				<input type="checkbox" ng-model="todo.done">
    				<span class="done-{{todo.done}}">{{todo.text}}</span>
    			</li>
    		</ul>
    		<form ng-submit="addTodo()">
    			<input type="text" ng-model="todoText"  size="30"
    			       placeholder="add new todo here">
    			<input class="btn-primary" type="submit" value="add">
    		</form>
    	</div>
    
    	<style>
    		.done-true {
    			text-decoration: line-through;
    			color: grey;
    		}
    	</style>
    </div>

它当然单独也是可以运行的。注意到刚才的todo.js里，第一句就是widgets这个module的声明，如果在门户中同时加载clock和todo，就会出问题，因为对widgets这个module声明了两次，怎么办呢？

我们想到把module的声明放在directive里，如果未声明这个module，就声明一下，这样，在部件里不用写module的声明了，于是，app loader的代码变成了这样：

    angular.module("mis").directive("appLoader", ["$http", "$compile", function ($http) {
    	return function (scope, element, attrs) {
    		var module = attrs.module;
    		var url = attrs.url;
    		var scripts = attrs.scripts.split(",") || [];
    
    		try {
    			var m = angular.module(module);
    		}
    		catch (ex) {
    			angular.module(module, []);
    		}
     
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

通过一个try语句，我们在未声明module的情况下，动态声明了一个，这样，这两个widget就可以同时挂接在门户上了。

##3.3 位于门户命名空间下的部件

在3.2节中提到的这些部件，命名空间都与门户不同，那么，如果这些部件本身就位于门户的命名空间内，应当如何处理呢？

我们来写一个商品订购部件的示例代码：

goods.js

    angular.module("mis").controller("GoodsCtrl",  ["$scope", "EventBus", function ($scope, EventBus) {
    	$scope.numOfApple = 0;
    	$scope.numOfOrange = 0;
    	$scope.numOfPear = 0;
    
    	$scope.submit = function() {
    		//todo
    	}
    }]);

goods.html

    <div ng-controller="GoodsCtrl" class="panel panel-default">
    	<div class="panel-heading">
    		<h3 class="panel-title">Goods List</h3>
    	</div>
    	<div class="panel-body">
    		<form role="form">
    			<div class="form-group">
    				<label>Apple</label>
    				<input type="number" ng-model="numOfApple" min="0" class="form-control"/>
    			</div>
    			<div class="form-group">
    				<label>Orange</label>
    				<input type="number" ng-model="numOfOrange" min="0" class="form-control"/>
    			</div>
    			<div class="form-group">
    				<label>Pear</label>
    				<input type="number" ng-model="numOfPear" min="0" class="form-control"/>
    			</div>
    			<div class="form-group">
    				<button ng-click="submit()" class="btn">submit</button>
    			</div>
    		</form>
    	</div>
    </div>

代码很简单，没什么特别的，先不考虑提交按钮要做的事情。

试试用刚才的app loader加载这个吧：

    <div app-loader url="partial/goods.html" scripts="js/order/goods.js" module="mis"></div>

结果是不行的，为什么呢？因为我们之前用angular.bootstrap来初始化新的module，不管是clock还是todo，都是挂在MIS门户下的，并且，这两个widget没有上下级关系，所以用bootstrap没有问题。但是现在的情况下，因为门户自身已经在mis命名空间下bootstrap过了，我们又搞个新的DOM结构，还用同一个命名空间来bootstrap它，然后放在原先的DOM树下，所以出问题了。

对于这种在弄个新的指令吧，叫partial loader。注意到在所有的Angular指导中，在同一module下动态加入新DOM，都是用$compile来做，我们也不例外：

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

现在我们使用的时候不必显式指定module了：

    <div partial-loader url="partial/goods.html" scripts="js/order/goods.js"></div>

一运行，还是不行，报错了，说GoodsCtrl没有找到，为什么？

来看看这篇文章吧：[lazy-loading-in-angularjs](http://ify.io/lazy-loading-in-angularjs/ "")，它给我们解释了原理，也提供了解决办法，所以可以借用。我们只要在MIS这个module初始化的时候加这么一段配置就可以了：

	app.config(function ($controllerProvider) {
		app.controller = $controllerProvider.register;
	});

现在，我们的商品列表部件就能跑起来了。

#4. 文件的缓存

#5. 部件的通信

门户与部件，部件之间都可能会有通信的需求。在第一部分异构部件的集成中，我们已经提到采用iframe的方式集成部件，可以使用postMessage的方式做通信。如果部件也是使用Angular体系，应当如何处理它们的通信呢？

## 5.1. 同一命名空间下的通信

为了演示，我们再创建一个部件叫做cart，功能是展示之前在goods部件中订购的商品。当用户在goods部件中订购商品之后，应当在cart部件中展示这些已订购商品，并且计算它们的总价。

很显然goods跟cart部件分别有不同的控制器，在Angular里，不同控制器的通信方式有多种，可以参见这篇总结：[控制器之间的通信](https://github.com/joeylin/angular-note/blob/master/controller-communication.md "")。

因为我们的部件之间不存在作用域继承关系，所以通过一个服务或者是$rootScope来作通信比较好，我们创建一个服务叫做事件总线：

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

接着，把刚才的商品列表的提交代码完善一下：

goods.js

    angular.module("mis").controller("GoodsCtrl",  ["$scope", "EventBus", function ($scope, EventBus) {
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
    }]);

我们可以看到，在商品提交的时候，往这个事件总线上发了一个purchase事件，带有所购买的商品种类和价值数据，然后，在购物车里面如何处理呢？

购物车部件的代码如下：

cart.html

    <div class="panel panel-default" ng-controller="CartCtrl">
    	<div class="panel-heading">
    		<h3 class="panel-title">Shopping Cart</h3>
    	</div>
    	<div class="panel-body">
    		<table class="table table-hover table-bordered">
    			<thead>
    				<tr>
    					<th>Type</th>
    					<th>Number</th>
    					<th>Price</th>
    				</tr>
    			</thead>
    			<tbody>
    				<tr ng-repeat="good in goodsList">
    					<td ng-bind="good.type"></td>
    					<td ng-bind="good.number"></td>
    					<td ng-bind="good.price"></td>
    				</tr>
    			</tbody>
    			<tfoot>
    				<div>
    					Hello, <span ng-bind="user.name"></span>, total price is <span ng-bind="price"></span>.
    				</div>
    			</tfoot>
    		</table>
    	</div>
    </div>

cart.js

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

我们直接在事件总线上监控purchase事件就可以了，然后对事件的数据进行一些处理，整个逻辑就这么简单。

#6. 界面流  

大家经常见到一些测试性格的选择题，每次展示一个题目，如果选择A，就跳转到第5题，选择B就跳转到第7题这样的。假如说这些选项是固定的，那很简单，无非是加很多判断，如果每个步骤都是可以配置的，这个实现方式就值得去思考一下了。

我们常常有这样的需求，类似一个wizard的界面，一步一步引导用户完成某些事情，每个步骤的下一步可能跟当前步骤的选择有关，这种就是一个工作流的典型应用场景。

即使是工作流，在这种场景下也有两种用法，一种是执行过程放在服务端，一种是放在客户端。前者实现起来更复杂一些，流程启动的时候，去发起一个请求，把流程模版实例化，然后从开始节点往后，得到第一个节点数据返回给前端，

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
