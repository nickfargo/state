( function ( $, assert, undefined ) {

module( "State.Definition" );

test( "Simple: methods only", function () {
	var def = State.Definition({
		methodOne: function () { return 'methodOne'; },
		methodTwo: function () { return 'methodTwo'; }
	});
	assert.ok( def instanceof State.Definition );
	assert.equal( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	assert.equal( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
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
	assert.ok( def instanceof State.Definition, "Definition created" );
	assert.equal( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	assert.equal( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
	assert.ok( def.events.enter instanceof Array, "Event type 'enter' defined as array" );
	assert.equal( def.events.enter[0](), 'enter', "events.enter[0]()" );
	assert.ok( def.events.exit instanceof Array, "Event type 'exit' defined as array" );
	assert.equal( def.events.exit[0](), 'exit 0', "events.exit[0]()" );
	assert.equal( def.events.exit[1](), 'exit 1', "events.exit[1]()" );
	assert.ok( def.guards.release, "Rule 'release' created" );
	assert.equal( def.guards.release[''](), 'release ""', "Rule release['']");
	assert.ok( def.states.Substate, "Substate 'Substate' created" );
	assert.equal( def.states.Substate.methods.methodOne(), "Substate methodOne", "Substate methodOne" );
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
		guards: {
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
				guards: {
					
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
	
	assert.ok( def instanceof State.Definition, "Definition created" );
	
	
	assert.ok( def.methods, "methods" );
	assert.equal( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	assert.equal( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
	
	
	assert.ok( def.events.enter instanceof Array, "Event type 'enter' defined as array" );
	assert.equal( def.events.enter[0](), 'enter', "events.enter[0]()" );
	assert.ok( def.events.exit instanceof Array, "Event type 'exit' defined as array" );
	assert.equal( def.events.exit[0](), 'exit 0', "events.exit[0]()" );
	assert.equal( def.events.exit[1](), 'exit 1', "events.exit[1]()" );
	
	
	assert.ok( def.guards.release, "Rule release created" );
	assert.equal( def.guards.release[''](), 'release ""', "Rule release['']");
	
	
	assert.ok( def.states.SimpleSubstate, "SimpleSubstate created" );
	assert.ok( def.states.SimpleSubstate instanceof State.Definition, "StateDefinition for SimpleSubstate created" );
	
	assert.ok( def.states.SimpleSubstate.methods, "SimpleSubstate.methods exists" );
	assert.equal( def.states.SimpleSubstate.methods.methodOne(), 'SimpleSubstate.methodOne', "SimpleSubstate.methodOne" );
	
	assert.ok( def.states.CompoundSubstate instanceof State.Definition, "StateDefinition for CompoundSubstate created" );
	assert.ok( def.states.CompoundSubstate.methods, "CompoundSubstate.methods exists" );
	assert.equal( def.states.CompoundSubstate.methods.methodOne(), 'CompoundSubstate.methodOne', "CompoundSubstate.methodOne" );
	assert.equal( def.states.CompoundSubstate.methods.methodTwo(), 'CompoundSubstate.methodTwo', "CompoundSubstate.methodTwo" );
	assert.ok( def.states.CompoundSubstate.events, "CompoundSubstate.events exists" );
	assert.ok( def.states.CompoundSubstate.events.enter instanceof Array, "Event type 'enter' defined as array" );
	assert.equal( def.states.CompoundSubstate.events.enter[0](), 'enter', "CompoundSubstate.events.enter[0]()" );
	assert.ok( def.states.CompoundSubstate.events.exit instanceof Array, "Event type 'exit' defined as array" );
	assert.equal( def.states.CompoundSubstate.events.exit[0](), 'exit 0', "CompoundSubstate.events.exit[0]()" );
	assert.equal( def.states.CompoundSubstate.events.exit[1](), 'exit 1', "CompoundSubstate.events.exit[1]()" );
	
	assert.ok( def.states.ComplexSubstate instanceof State.Definition, "StateDefinition for ComplexSubstate created" );
	assert.ok( def.states.ComplexSubstate.states, "ComplexSubstate.states exists" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate instanceof State.Definition, "StateDefinition for DeepSubstate created" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.methods, "DeepSubstate.methods exists" );
	assert.equal( def.states.ComplexSubstate.states.DeepSubstate.methods.methodOne(), 'DeepSubstate.methodOne', "DeepSubstate.methodOne" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate instanceof State.Definition, "StateDefinition for VeryDeepSubstate created" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods, "VeryDeepSubstate.methods exists" );
	assert.equal( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods.methodOne(), 'VeryDeepSubstate.methodOne', "VeryDeepSubstate.methodOne" );
});

})( jQuery, QUnit || require('assert') );
