( function ( $, undefined ) {

module( "State.Definition" );

test( "Simple: methods only", function () {
	var def = State.Definition({
		methodOne: function () { return 'methodOne'; },
		methodTwo: function () { return 'methodTwo'; }
	});
	ok( def instanceof State.Definition );
	equals( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	equals( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
});

test( "Compound: array", function () {
	var def = State.Definition({
		methodOne: function () { return 'methodOne'; },
		methodTwo: function () { return 'methodTwo'; },
		enter: function () { return 'enter'; },
		exit: [
			function () { return 'exit 0'; },
			function () { return 'exit 1'; }
		],
		release: {
			'': function () { return 'release ""'; }
		},
		Substate: {
			methodOne: function () { return 'Substate methodOne'; }
		}
	});
	ok( def instanceof State.Definition, "Definition created" );
	equals( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	equals( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
	ok( def.events.enter instanceof Array, "Event type 'enter' defined as array" );
	equals( def.events.enter[0](), 'enter', "events.enter[0]()" );
	ok( def.events.exit instanceof Array, "Event type 'exit' defined as array" );
	equals( def.events.exit[0](), 'exit 0', "events.exit[0]()" );
	equals( def.events.exit[1](), 'exit 1', "events.exit[1]()" );
	ok( def.rules.release, "Rule 'release' created" );
	equals( def.rules.release[''](), 'release ""', "Rule release['']");
	ok( def.states.Substate, "Substate 'Substate' created" );
	equals( def.states.Substate.methods.methodOne(), "Substate methodOne", "Substate methodOne" );
});

test( "Complex: map", function () {
	var def = State.Definition({
		methods: {
			methodOne: function () { return 'methodOne'; },
			methodTwo: function () { return 'methodTwo'; }
		},
		events: {
			enter: function () { return 'enter'; },
			exit: [
				function () { return 'exit 0'; },
				function () { return 'exit 1'; }
			]
		},
		rules: {
			release: {
				'': function () { return 'release ""'; }
			}
		},
		states: {
			SimpleSubstate: {
				methodOne: function () { return 'SimpleSubstate.methodOne'; }
			},
			CompoundSubstate: {
				methodOne: function () { return 'CompoundSubstate.methodOne'; },
				methodTwo: function () { return 'CompoundSubstate.methodTwo'; },
				
				enter: function () { return 'enter'; },
				exit: [
					function () { return 'exit 0'; },
					function () { return 'exit 1'; }
				],
				
				release: {
					'': true,
					'.': function () { return true; }
				},
				admit: {
					'.SimpleSubstate': function () { return 'CompoundSubstate.admit ".SimpleSubstate"'; }
				}
			},
			ComplexSubstate: {
				methods: {
					
				},
				events: {
					
				},
				rules: {
					
				},
				states: {
					DeepSubstate: {
						methods: {
							methodOne: function () { return 'DeepSubstate.methodOne'; }
						},
						states: {
							VeryDeepSubstate: {
								methods: {
									methodOne: function () { return 'VeryDeepSubstate.methodOne'; }
								}
							}
						}
					},
					DeepEmptySubstate: {
					},
					DeepSimpleSubstate: {
						methodOne: function () { return 'DeepSimpleSubstate.methodOne'; }
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
	ok( def.events.exit instanceof Array, "Event type 'exit' defined as array" );
	equals( def.events.exit[0](), 'exit 0', "events.exit[0]()" );
	equals( def.events.exit[1](), 'exit 1', "events.exit[1]()" );
	
	
	ok( def.rules.release, "Rule release created" );
	equals( def.rules.release[''](), 'release ""', "Rule release['']");
	
	
	ok( def.states.SimpleSubstate, "SimpleSubstate created" );
	ok( def.states.SimpleSubstate instanceof State.Definition, "StateDefinition for SimpleSubstate created" );
	
	ok( def.states.SimpleSubstate.methods, "SimpleSubstate.methods exists" );
	equals( def.states.SimpleSubstate.methods.methodOne(), 'SimpleSubstate.methodOne', "SimpleSubstate.methodOne" );
	
	ok( def.states.CompoundSubstate instanceof State.Definition, "StateDefinition for CompoundSubstate created" );
	ok( def.states.CompoundSubstate.methods, "CompoundSubstate.methods exists" );
	equals( def.states.CompoundSubstate.methods.methodOne(), 'CompoundSubstate.methodOne', "CompoundSubstate.methodOne" );
	equals( def.states.CompoundSubstate.methods.methodTwo(), 'CompoundSubstate.methodTwo', "CompoundSubstate.methodTwo" );
	ok( def.states.CompoundSubstate.events, "CompoundSubstate.events exists" );
	ok( def.states.CompoundSubstate.events.enter instanceof Array, "Event type 'enter' defined as array" );
	equals( def.states.CompoundSubstate.events.enter[0](), 'enter', "CompoundSubstate.events.enter[0]()" );
	ok( def.states.CompoundSubstate.events.exit instanceof Array, "Event type 'exit' defined as array" );
	equals( def.states.CompoundSubstate.events.exit[0](), 'exit 0', "CompoundSubstate.events.exit[0]()" );
	equals( def.states.CompoundSubstate.events.exit[1](), 'exit 1', "CompoundSubstate.events.exit[1]()" );
	
	ok( def.states.ComplexSubstate instanceof State.Definition, "StateDefinition for ComplexSubstate created" );
	ok( def.states.ComplexSubstate.states, "ComplexSubstate.states exists" );
	ok( def.states.ComplexSubstate.states.DeepSubstate instanceof State.Definition, "StateDefinition for DeepSubstate created" );
	ok( def.states.ComplexSubstate.states.DeepSubstate.methods, "DeepSubstate.methods exists" );
	equals( def.states.ComplexSubstate.states.DeepSubstate.methods.methodOne(), 'DeepSubstate.methodOne', "DeepSubstate.methodOne" );
	ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate instanceof State.Definition, "StateDefinition for VeryDeepSubstate created" );
	ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods, "VeryDeepSubstate.methods exists" );
	equals( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods.methodOne(), 'VeryDeepSubstate.methodOne', "VeryDeepSubstate.methodOne" );
});

})(jQuery);
