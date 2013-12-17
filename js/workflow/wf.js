var wf = angular.module("workflow", []);

wf.factory("StateMachine", function () {
	var StateMachine = function () {
		this.name = "State Machine";
		this.states = {};
		this.transitions = [];

		this.startState = this.addState({name: "Start"});
		this.finishState = this.addState({name: "Finish"});

		this.currentState = this.startState;
	};

	StateMachine.prototype = {
		load: function (data) {
			for (var i = 0; i < data.states.length; i++) {
				this.addState(data.states[i]);
			}

			for (var i = 0; i < data.transitions.length; i++) {
				this.addTransition(data.transitions[i]);
			}
		},

		execute: function () {
			this.currentState.execute();

			for (var i = 0; i < this.transitions.length; i++) {
				if (this.transitions[i].from == this.currentState) {
					if (this.transitions[i].evaluate()) {
						this.currentState = this.transitions[i].to;
						break;
					}
				}
			}
		},

		rollback: function () {

		},

		addState: function (data) {
			var state = new State(data);

			state.stateMachine = this;
			this.states[data.name] = state;

			return state;
		},

		addTransition: function (data) {
			var transition = new Transition(data);

			transition.stateMachine = this;
			transition.from = this.states[data.from];
			transition.to = this.states[data.to];
			this.transitions.push(transition);

			return transition;
		},

		isFinished: function () {
			return this.currentState == this.finishState;
		}
	};

	var State = function (data) {
		this.name = data.name || "State";

		this.stateMachine = null;
		this.functions = data.functions || [];
	};

	State.prototype = {
		addFunction: function (func) {
			this.functions.push(func);
			func.state = this;
		},

		execute: function () {
			for (var i = 0; i < this.functions.length; i++) {
				this.functions[i].apply(this.stateMachine);
			}
		}
	};

	var Transition = function (data) {
		this.name = data.name || "Transition";
		this.condition = data.condition;

		this.stateMachine = null;
	};

	Transition.prototype = {
		evaluate: function () {
			if (!this.condition) {
				return true;
			}
			else {
				return this.condition.call(this.stateMachine);
			}
		}
	};

	return StateMachine;
});

wf.controller("Euclid", function ($scope, StateMachine) {
	var sm = new StateMachine();

	$scope.init = function () {
		var data = {
			states: [
				{
					name: "Prepare",
					functions: [function () {
						this.big = this.a;
						this.small = this.b;
					}]
				},
				{
					name: "Euclid",
					functions: [function () {
						var result = this.big % this.small;
						this.big = this.small;
						this.small = result;
					}]
				}
			],
			transitions: [
				{
					from: "Start",
					to: "Prepare"
				},
				{
					from: "Prepare",
					to: "Euclid"
				},
				{
					from: "Euclid",
					to: "Euclid",
					condition: function () {
						return (this.big % this.small != 0);
					}
				},
				{
					from: "Euclid",
					to: "Finish",
					condition: function () {
						return (this.big % this.small == 0);
					}
				}
			]
		};
		sm.load(data);
	};

	$scope.submit = function () {
		sm.a = $scope.a;
		sm.b = $scope.b;

		while (sm.currentState != sm.finishState) {
			sm.execute();
		}

		$scope.result = sm.small;
	};
});

wf.controller("Wizard1", function ($scope, StateMachine) {
	var sm = new StateMachine();

	$scope.init = function () {
		var data = {
			states: [
				{
					name: "Prepare",
					functions: [function () {
						this.a = 1;
					}]
				},
				{
					name: "Inc",
					functions: [function () {
						this.a++;
					}]
				}
			],
			transitions: [
				{
					from: "Start",
					to: "Prepare"
				},
				{
					from: "Prepare",
					to: "Increase"
				},
				{
					from: "Increase",
					to: "Increase",
					condition: function () {
						return this.a < 5;
					}
				},
				{
					from: "Increase",
					to: "Finish"
				}
			]
		};
		sm.load(data);
	};

	$scope.prev = function () {

	};

	$scope.next = function () {
		sm.execute();
	};

	$scope.isFirst = function () {
		return sm.currentState == sm.startState;
	};

	$scope.isLast = function () {
		return sm.currentState == sm.finishState;
	};
});