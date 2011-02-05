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
			SimpleChildState: {
				methodOne: function() { return 'SimpleChildState.methodOne'; }
			},
			CompoundChildState: [
				{
					methodOne: function() { return 'CompoundChildState.methodOne'; },
					methodTwo: function() { return 'CompoundChildState.methodTwo'; }
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
						'': true,
						'.': function() { return true; }
					},
					allowEnteringFrom: {
						'.SimpleChildState': function() { return 'CompoundChildState.allowEnteringFrom ".SimpleChildState"'; }
					}
				}
			],
			ComplexChildState: {
				methods: {
					
				},
				events: {
					
				},
				rules: {
					
				},
				states: {
					DeepChildState: {
						methods: {
							methodOne: function() { return 'DeepChildState.methodOne'; }
						},
						states: {
							VeryDeepChildState: {
								methods: {
									methodOne: function() { return 'VeryDeepChildState.methodOne'; }
								}
							}
						}
					},
					DeepEmptyChildState: {
					},
					DeepSimpleChildState: {
						methodOne: function() { return 'DeepSimpleChildState.methodOne'; }
					}
				}
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
	
	
	ok( def.states.SimpleChildState, "SimpleChildState created" );
	ok( def.states.SimpleChildState instanceof State.Definition, "StateDefinition for SimpleChildState created" );
	
	ok( def.states.SimpleChildState.methods, "SimpleChildState.methods exists" );
	equals( def.states.SimpleChildState.methods.methodOne(), 'SimpleChildState.methodOne', "SimpleChildState.methodOne" );
	
	ok( def.states.CompoundChildState instanceof State.Definition, "StateDefinition for CompoundChildState created" );
	ok( def.states.CompoundChildState.methods, "CompoundChildState.methods exists" );
	equals( def.states.CompoundChildState.methods.methodOne(), 'CompoundChildState.methodOne', "CompoundChildState.methodOne" );
	equals( def.states.CompoundChildState.methods.methodTwo(), 'CompoundChildState.methodTwo', "CompoundChildState.methodTwo" );
	ok( def.states.CompoundChildState.events, "CompoundChildState.events exists" );
	ok( def.states.CompoundChildState.events.enter instanceof Array, "Event type 'enter' defined as array" );
	equals( def.states.CompoundChildState.events.enter[0](), 'enter', "CompoundChildState.events.enter[0]()" );
	ok( def.states.CompoundChildState.events.leave instanceof Array, "Event type 'leave' defined as array" );
	equals( def.states.CompoundChildState.events.leave[0](), 'leave 0', "CompoundChildState.events.leave[0]()" );
	equals( def.states.CompoundChildState.events.leave[1](), 'leave 1', "CompoundChildState.events.leave[1]()" );
	
	ok( def.states.ComplexChildState instanceof State.Definition, "StateDefinition for ComplexChildState created" );
	ok( def.states.ComplexChildState.states, "ComplexChildState.states exists" );
	ok( def.states.ComplexChildState.states.DeepChildState instanceof State.Definition, "StateDefinition for DeepChildState created" );
	ok( def.states.ComplexChildState.states.DeepChildState.methods, "DeepChildState.methods exists" );
	equals( def.states.ComplexChildState.states.DeepChildState.methods.methodOne(), 'DeepChildState.methodOne', "DeepChildState.methodOne" );
	ok( def.states.ComplexChildState.states.DeepChildState.states.VeryDeepChildState instanceof State.Definition, "StateDefinition for VeryDeepChildState created" );
	ok( def.states.ComplexChildState.states.DeepChildState.states.VeryDeepChildState.methods, "VeryDeepChildState.methods exists" );
	equals( def.states.ComplexChildState.states.DeepChildState.states.VeryDeepChildState.methods.methodOne(), 'VeryDeepChildState.methodOne', "VeryDeepChildState.methodOne" );
});

delete def;

})(jQuery);
