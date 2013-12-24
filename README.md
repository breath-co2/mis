基于AngularJS构建Web应用门户
====

在应用型的Web系统中，有很大一类是MIS系统，MIS全称是管理信息系统，代表着一大类传统软件，包括办公自动化，资源管理，业务受理，金融结算等各大方向。曾经这些系统都是C/S架构的，但是最近10年，大部分都迁移到B/S架构了。

对B/S系统的架构有很多文章谈，但一般都集中在后端架构，很少有谈前端的，更少细致深入谈前端架构的，这个系列文章，就是打算作一下尝试，对每个细节，也尽量会给一些具体实现方式的建议。

本文示例代码使用的框架为AngularJS，版本为1.2.5。

#1. 应用门户的规划

企业应用门户的设计，其实是一个很考验规划水准的事。因为它首先要集成别人的功能部件，还要考虑自己的功能部件如何被别人集成。它的设计思路直接影响到一大堆代码按照什么规范进行开发。挂在这个门户上的业务模块，有的很简单，不会影响别人，有的可能会影响别人，要想个办法把它隔离起来，还有的本身就要跟别人通讯。

我们看看一个典型的场景，一个工作台，或者说门户界面，上面能够放很多小部件，类似iGoogle那样，用户可以任意加已有的部件，这些部件都是基于某种约定，由第三方开发人员完成，该怎么实现呢？

##1.1. 异构的第三方部件

在B/S模式下，最简单的部件集成方式是iframe，每个功能部件都以iframe的方式被集成起来。这种方式是很简便，但有一些弊端，比如说，被集成的部件界面自身功能要完整，即使没有门户界面，它也要能运行起来，这就要求它自身就包含所依赖的库，这么一来，每个界面都加载了一套库，实际上这是公共的，没有必要每个界面都加载，网络传输这个可以通过缓存来解决，但每个库自己在当前页面构建的一套内存环境，是没法优化的。

所以，使用iframe来做集成，只适合那些异构系统，这种场景下，我们无法控制被集成方的代码编写方式，比如说要在门户里集成一个第三方的天气widget，基本只能通过这种方式。

这种集成的部件，如果有跟门户自身或者其他部件有通讯的需求，不考虑低端浏览器的话，一般可以用postMessage做，不管部件跟门户是否同域，都能够执行。

#1.2. 简单逻辑的HTML片段

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

##1.3. 同构的界面部件

什么是同构的界面部件呢？意思是这个部件的开发过程采用了与门户一样的开发技术和规范，在我们这里，就是指使用了Angular框架。

###1.3.1. 纯界面模板部件

我们知道，Angular框架中有controller，service等部分，对于一个部件来说，它可能有这些部分，也可能没有，如果没有的话，那是非常简单的，这时候这个界面部件就退化成界面模板，只需要用ng-include把这个部件引入到主界面中，就可以正常运行了。

这种情况，跟刚才1.2节中提到的部分还是有区别的，差异在于，这个界面模板里可以带有一些Angular的模板语法，比如直接引用已经在主界面的$scope或者$rootScope上存在的变量，也可以使用已经被主界面加载过的controller和factory等定义。

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

###1.3.2. 有独立命名空间的部件

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






















现在我们有一些办法来实现这个功能，但是消除带来的缺陷。比如说，AngularJS框架的ng-include和ng-view功能，就很适合做这个。如果使用ng-view，需要配合路由功能来使用。

一条功能菜单，首先必须是有界面的，这个界面可以是html partial，只有html的其中一个片段，没有头尾，除此之外，绝大多数还需要有逻辑代码，在AngularJS中，体现为controller，service等。

考虑到MIS系统一般比较庞大，这两块东西都是要做按需载入的，html的动态载入比较简单，就$http.get获取过来，然后设置到界面某个地方的innerHTML完事，但是它上面绑定的controller就有些麻烦了。我们还是先看简单的吧，只有html的情况如何处理。

	<div ng-include src="'views/sidepanel.html'"></div>

这句代码非常简单，src所指向的界面片段将被直接包含进来，跟直接写在主界面中所表现出来的行为完全一致。


我们来看看如果用路由，该如何实现这个场景。

	var todoApp = angular.module('todoApp', [])
		.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/users', 
				{templateUrl: 'users.html', controller: 'UsersCtrl'}
			)
			.when('/todos', 
				{templateUrl: 'todos.html', controller: 'TodoCtrl' }
			)
			.otherwise({ redirectTo: '/users' });
			}]);

	todoApp.controller('UsersCtrl', function($scope) {
		$scope.users = [];
	});

	todoApp.controller('TodoCtrl', function($scope) {
		$scope.todos = [];
	});

HTML界面里加上这句即可：

	<div ng-view></div>

这样，我们在url上改变路径，就可以动态改变这个view，加载对应的partial界面。

这么做有什么弊端呢？我们注意到，controller必须先加载出来，如果菜单模块很多，这么做就不太合适了，我们还是需要一个缓加载的机制，所幸AngularJS也帮我们考虑到了，他提供一个机制让加载路由之前可以插入自己的代码，我们可以在这里引入我们的控制器。


还是有问题，因为在界面中只能存在一个ng-view，假如我们不是每次只想打开一个菜单界面，而是每一个作为选项卡打开，该怎么办呢？好像AngularJS没有为我们考虑这个问题，不要紧，毛主席教导我们：自己动手，丰衣足食。

我们来看看加载界面的过程。

#2. 界面的模块化

第一部分的内容涉及了一个主题，就是界面的模块化。我们注意到，在这种方式下，菜单界面不再是独立可运行的，而是一个部件，需要依托主界面来运行，这实际上就是一种模块化。前端的模块化，在界面来说，是以部件模版这种方式存在，在JavaScript来说，是类似AngularJS提供的controller和service这样的定义方式。

#3. 门户的可定制化

有了界面部件，我们也就可以很容易实现门户的定制化了。

#4. 界面流

大家经常见到一些测试性格的选择题，每次展示一个题目，如果选择A，就跳转到第5题，选择B就跳转到第7题这样的。假如说这些选项是固定的，那很简单，无非是加很多判断，如果每个步骤都是可以配置的，这个实现方式就值得去思考一下了。

我们常常有这样的需求，类似一个wizard的界面，一步一步引导用户完成某些事情，每个步骤的下一步可能跟当前步骤的选择有关，这种就是一个工作流的典型应用场景。

即使是工作流，在这种场景下也有两种用法，一种是执行过程放在服务端，一种是放在客户端。前者实现起来更复杂一些，流程启动的时候，去发起一个请求，把流程模版实例化，然后从开始节点往后，得到第一个节点数据返回给前端，

	function FlowController($scope) {
		$scope.currentState = null;

		var data = {
			states: [],
			transitions: []
		};

		$scope.loadData = function(data) {
			this.states = data.states;
		};

		$scope.execute = function() {
			if (this.currentState) {
				this.currentState.execute();
			}
		};

		$scope.loadData(flowData);
	}