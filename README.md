MIS系统全称是管理信息系统，代表着一大类传统软件，包括办公自动化，资源管理，业务受理，金融结算等各大方向。曾经这些系统都是C/S架构的，但是最近10年，大部分都迁移到B/S架构了。

对B/S系统的架构有很多文章谈，但一般都集中在后端架构，很少有谈前端的，更少细致深入谈前端架构的，这个系列文章，就是打算作一下尝试，对每个细节，也尽量会给一些具体实现方式的建议。


#1. 菜单的集成

菜单集成是一个MIS系统最基础的需求，在B/S模式下，最简单的菜单集成方式是iframe，在门户界面放置iframe，然后链接到具体菜单的页面，每当主菜单的项被点击的时候，设置这个iframe地址即可。也可以动态创建选项卡，在每个选项卡里面放置一个新的iframe，为它设置链接为当前点击的菜单项url。

这种方式是很简便，但有一些弊端，比如说，被集成的菜单界面自身功能要完整，即使没有门户界面，它也要能运行起来，这就要求它自身就包含所依赖的库，这么一来，每个界面都加载了一套库，实际上这是公共的，没有必要每个界面都加载，网络传输这个可以通过缓存来解决，但每个库自己在当前页面构建的一套内存环境，是没法优化的。

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