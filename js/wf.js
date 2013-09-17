
var wf = angular.module("wf", []);

wf.factory("StateMachine", function() {
	var StateMachine = function() {
		this.currentState = null;
		this.states = [];
	};

	StateMachine.prototype = {
		load: function(data) {

		},

		execute: function() {

		}
	};

	var State = function() {

	};

	State.prototype = {

	};

	var Transition = function() {

	};

	Transition.prototype = {

	};

	return StateMachine;
});

wf.controller("", function($scope, StateMachine) {
	var sm = new StateMachine();
	sm.load($scope.data);
});