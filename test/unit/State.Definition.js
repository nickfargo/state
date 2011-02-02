( function( $, undefined ) {

module( "State.Definition" );

var def;

test( "Simple: methods only", function() {
	def = State.Definition({
		methodOne: function() { return 'methodOne'; },
		methodTwo: function() { return 'methodTwo'; }
	});
	ok( def instanceof State.Definition );
	equals( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	equals( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
});

test( "Compound: array", function() {
	def = State.Definition([
		{
			methodOne: function() { return 'methodOne'; },
			methodTwo: function() { return 'methodTwo'; }
		},
		{
			enter: function() { return 'enter'; },
			leave: [
				function() { return 'leave 0'; },
				function() { return 'leave 1'; }
			]
		},
		{
			allowLeavingTo: {
				'': function() { return 'allowLeavingTo ""'; }
			}
		}
	]);
	ok( def instanceof State.Definition, "Definition created" );
	equals( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	equals( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
	ok( def.events.enter instanceof Array, "Event type 'enter' defined as array" );
	equals( def.events.enter[0](), 'enter', "events.enter[0]()" );
	ok( def.events.leave instanceof Array, "Event type 'leave' defined as array" );
	equals( def.events.leave[0](), 'leave 0', "events.leave[0]()" );
	equals( def.events.leave[1](), 'leave 1', "events.leave[1]()" );
	ok( def.rules.allowLeavingTo, "Rule allowLeavingTo created" );
	equals( def.rules.allowLeavingTo[''](), 'allowLeavingTo ""', "Rule allowLeavingTo['']");
});

test( "Complex: map", function() {
	debugger;
	def = State.Definition({
		methods: {
			methodOne: function() { return 'methodOne'; },
			methodTwo: function() { return 'methodTwo'; }
		},
		events: {
			enter: function() { return 'enter'; },
			leave: [
				function() { return 'leave 0'; },
				function() { return 'leave 1'; }
			]
		},
		rules: {
			allowLeavingTo: {
				'': function() { return 'allowLeavingTo ""'; }
			}
		},
		states: {
			ChildState: {
				methodOne: function() { return 'ChildState.methodOne'; }
			}
		}
	});
	ok( def instanceof State.Definition, "Definition created" );
	ok( def.methods, "methods" );
	equals( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	equals( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
	ok( def.events.enter instanceof Array, "Event type 'enter' defined as array" );
	equals( def.events.enter[0](), 'enter', "events.enter[0]()" );
	ok( def.events.leave instanceof Array, "Event type 'leave' defined as array" );
	equals( def.events.leave[0](), 'leave 0', "events.leave[0]()" );
	equals( def.events.leave[1](), 'leave 1', "events.leave[1]()" );
	ok( def.rules.allowLeavingTo, "Rule allowLeavingTo created" );
	equals( def.rules.allowLeavingTo[''](), 'allowLeavingTo ""', "Rule allowLeavingTo['']");
	ok( def.states.ChildState, "ChildState created" );
	ok( def.states.ChildState instanceof State.Definition, "StateDefinition for ChildState created" );
	equals( def.states.ChildState.methods.methodOne(), 'ChildState.methodOne', "ChildState.methodOne" );
});

})(jQuery);
