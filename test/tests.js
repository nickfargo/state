( function ( $, undefined ) {

var	State = state.State,
	Transition = state.Transition;

function TestObject ( initialState ) {
	/*
	 * A method of the `TestObject` object, defined as usual. This implementation is identified as
	 * being **autochthonous**, or "of the original owner", and as such will always be called in the
	 * context of the `TestObject` object, even after it has been relocated to the default state.
	 */
	this.methodOne = function () { return this instanceof TestObject /* always true */ && 'methodOne'; };

	state( this, {
		/*
		 * A method defined on the default state. This implementation will be situated alongside
		 * `methodOne` inside the default state, however, because it is *not* autochthonous, like all
		 * state-declared methods, its calls will always be in the context of the state in which it was
		 * declared (in this case the default state).
		 */
		methodTwo: function () { return this instanceof State /* always true */ && 'methodTwo'; },


		// Three progressively more complex ways to define a state:

		// State 1. Simple: methods only
		Waiting: state( 'initial', {
			methodOne: function () {
				return 'Waiting.methodOne';
			}
		}),

		// State 2. Abbreviated: elements can be listed flatly; proper categorization is inferred
		Active: {
			// interpreted as a **method** (since "methodTwo" is neither an event or guard type).
			methodTwo: function () {
				return 'Active.methodTwo';
			},

			// interpreted as an **event** (since "arrive" is an event type) with one listener declared
			arrive: function () {
				// event.log();
			},

			// interpreted as an **event** (since "depart" is an event type) with multiple listeners declared
			depart: [
				function () {
					// event.log('1');
				},
				function () {
					// event.log('2');
				}
			],

			// interpreted as a **guard** (since "admit" is a guard type) **constant**
			admit: true,

			/*
			 * interpreted as a **guard** (since "release" is a guard type) **function** that may examine the
			 * counterpart `state` in determining its ruling
			 */
			release: function ( state ) {
				return this.root().has( state ); /* always true */
			},

			// a **substate**, with its own nested expression
			Hyperactive: {
				// some stateful **data**
				data: {
					description: "Alright now I'm really ready"
				},

				// another nested substate
				Tweaked: {
					// ...
				}
			},

			// a **transition**
			wiggle: Transition({
				origin: '*',
				action: function () {
					this.end();
				}
			})
		},

		// State 3. Verbose: elements are explicitly categorized
		Finished: {
			data: {
				a: 1,
				b: 'deux',
				c: false,
				d: {
					a: 'deep',
					b: 'thoughts'
				}
			},
			methods: {
				methodOne: function () {
					return 'Finished.methodOne';
				},
				methodThree: function ( uno, dos ) {
					return 'Finished.methodThree uno='+uno+' dos='+dos;
				}
			},
			events: {
				arrive: function () {
					// event.log();
				},
				depart: [
					function () {},
					function () {}
				]
			},
			guards: {
				release: {
					Waiting: function () { return false; },
					Active: function () { return false; },

					// leading "." references current state ('Finished.')
					'.CleaningUp': true
				},
				admit: {
					'Waiting, Active': function ( state ) {
						// console && console.log( 'Finished.allowArrivalFrom ' + state );
						return true;
					}
				}
			},
			states: {
				CleaningUp: {
					methodTwo: function () {
						return 'Finished.CleaningUp.methodTwo';
					},
					terminate: function () { return this.change( '..Terminated' ); },

					arrive: function () {
						// event.log( "I'm an event" );
					},

					transitions: {
						weee: {
							origin: '*',
							action: function () { this.end(); }
						}
					}
				},
				Terminated: {
					data: {
						a: 2,
						b: 'trois',
						d: {
							b: 'impact'
						}
					},
					methods: {
						methodTwo: function () {
							return 'Finished.Terminated.methodTwo';
						},
						methodThree: state.method( function ( uno, dos ) {
							var result = 'Finished.Terminated.methodThree';
							result += ' : ' + superstate.method('methodThree')( uno, dos );
							return result;
						})
					},
					guards: {
						release: {
							// empty string references the root state
							'': function ( state ) {
								// "this" references current state ('Finished.Terminated')
								// "state" references state to which controller is being changed ('')
								// console && console.log( 'Denying departure from ' + this + ' to ' + state );
								return false;
							},
							'*': true
						},
						admit: {
							'..CleaningUp': function () { return true; },
							'...Waiting': function () { return true; },

							// "." references current state ('Finished.Terminated')

							// ".." references parent state ('Finished')
							'..': true,

							// "..." references root state ('' == .root())

							// ".*" references any child state of parent state
							'.*': function () { return false; },

							// ".**" references any descendant state of parent state
							'.**': function () { return true; }
						}
					},
					states: {
						ReallyDead: {
						}
						// et cetera
					}
				}
			},
			transitions: {
				'fiercelyGuardedTransition': {
					origin: '*',
					admit: {
						'*': function ( target ) {
							return false;
						}
					}
				},
				'transitionName': {
					origin: '*',
					// /*
					action: function () {
						// do some business
						console && console.log( Date.now() + " - HANG ON, I'M OPERATING" );
						var self = this;
						setTimeout( function () {
							self.end();
							console && console.log( Date.now() + " - I'M DONE NOW GET ON WITH IT" );
						}, 1000 );
					},
					// */
					/* TODO: promise-based serial and asynchronous queueing
					action: [
						function ( op ) { console.log("1"); },
						// double array literal indicates a set of parallel asynchronous operations
						// succeeding operation will start only after all operations inside the `[[ ]]` have completed
						[[
							function ( op ) {
								console.log("2");
								this.fulfill();
							},
							[[
								function ( op ) {
									console.log("3");
									this.fulfill();
								},
								function ( op ) {
									console.log("4");
									this.fulfill();
								}
							]],
							[
								function ( op ) { console.log("5"); },
								function ( op ) { console.log("6"); }
							]
						]],
						// plain array literal indicates a sequential queue
						[
							function ( op ) { console.log("7"); },
							function ( op ) { console.log("8"); }
						]
					],
					// */
					start: function () {
						// console && console.log( "Transition 'transitionName' start" );
					},
					end: function () {
						// console && console.log( "Transition 'transitionName' end" );
					}
				},
				Transition2: {
					// origin: '*',
					// target: '.',
					action: function () { this.end(); }
				}
			}
		}
	}, initialState );
}
window.TestObject = TestObject;

})( jQuery );
1&&
( function ( $, assert, undefined ) {

module( "StateExpression" );

var StateExpression = state.StateExpression;

test( "Simple: methods only", function () {
	var def = state({
		methodOne: function () { return 'methodOne'; },
		methodTwo: function () { return 'methodTwo'; }
	});
	assert.ok( def instanceof StateExpression );
	assert.equal( def.methods.methodOne(), 'methodOne', "methods.methodOne()" );
	assert.equal( def.methods.methodTwo(), 'methodTwo', "methods.methodTwo()" );
});

test( "Compound: array", function () {
	var def = state({
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
	assert.ok( def instanceof StateExpression, "Expression created" );
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
	var def = state({
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

	assert.ok( def instanceof StateExpression, "Expression created" );


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
	assert.ok( def.states.SimpleSubstate instanceof StateExpression, "StateExpression for SimpleSubstate created" );

	assert.ok( def.states.SimpleSubstate.methods, "SimpleSubstate.methods exists" );
	assert.equal( def.states.SimpleSubstate.methods.methodOne(), 'SimpleSubstate.methodOne', "SimpleSubstate.methodOne" );

	assert.ok( def.states.CompoundSubstate instanceof StateExpression, "StateExpression for CompoundSubstate created" );
	assert.ok( def.states.CompoundSubstate.methods, "CompoundSubstate.methods exists" );
	assert.equal( def.states.CompoundSubstate.methods.methodOne(), 'CompoundSubstate.methodOne', "CompoundSubstate.methodOne" );
	assert.equal( def.states.CompoundSubstate.methods.methodTwo(), 'CompoundSubstate.methodTwo', "CompoundSubstate.methodTwo" );
	assert.ok( def.states.CompoundSubstate.events, "CompoundSubstate.events exists" );
	assert.ok( def.states.CompoundSubstate.events.enter instanceof Array, "Event type 'enter' defined as array" );
	assert.equal( def.states.CompoundSubstate.events.enter[0](), 'enter', "CompoundSubstate.events.enter[0]()" );
	assert.ok( def.states.CompoundSubstate.events.exit instanceof Array, "Event type 'exit' defined as array" );
	assert.equal( def.states.CompoundSubstate.events.exit[0](), 'exit 0', "CompoundSubstate.events.exit[0]()" );
	assert.equal( def.states.CompoundSubstate.events.exit[1](), 'exit 1', "CompoundSubstate.events.exit[1]()" );

	assert.ok( def.states.ComplexSubstate instanceof StateExpression, "StateExpression for ComplexSubstate created" );
	assert.ok( def.states.ComplexSubstate.states, "ComplexSubstate.states exists" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate instanceof StateExpression, "StateExpression for DeepSubstate created" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.methods, "DeepSubstate.methods exists" );
	assert.equal( def.states.ComplexSubstate.states.DeepSubstate.methods.methodOne(), 'DeepSubstate.methodOne', "DeepSubstate.methodOne" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate instanceof StateExpression, "StateExpression for VeryDeepSubstate created" );
	assert.ok( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods, "VeryDeepSubstate.methods exists" );
	assert.equal( def.states.ComplexSubstate.states.DeepSubstate.states.VeryDeepSubstate.methods.methodOne(), 'VeryDeepSubstate.methodOne', "VeryDeepSubstate.methodOne" );
});

})( jQuery, QUnit || require('assert') );

module( "state/core" );

var State           = state.State;
var StateController = state.StateController;

test( "State creation", function () {
    var x = new TestObject;

    ok( x.state().controller() instanceof StateController,
        "StateController created"
    );

    ok( x.state('Waiting') instanceof State,
        "State 'Waiting' created"
    );

    ok( x.state('Waiting').method( 'methodOne', false, false ),
        "Method 'methodOne' in state 'Waiting' created"
    );

    ok( x.state().is('Waiting'),
        "In state 'Waiting'"
    );

    ok( x.methodOne() === 'Waiting.methodOne',
        "Calling delegator `methodOne` returns proper method for state `Waiting`"
    );

    ok( x.state('Active'),
        "State `Active` exists"
    );

    ok( x.state('Hyperactive'),
        "State `Hyperactive` exists"
    );

    ok( !x.state('Active').method( 'methodOne', false, false ),
        "State `Active` does not contain method `methodOne`"
    );

    ok( x.state('Active').method( 'methodTwo', false, false ),
        "State `Active` does contain method `methodTwo`"
    );
});

test( "State destruction", function () {
    var x = new TestObject;

    ok( x.methodOne.isDelegator,
        "First establish that `methodOne` is a delegator method"
    );

    ok( x.state().controller().destroy(),
        "Successfully destroyed the state implementation from its root"
    );

    ok( typeof x.methodOne === 'function' && !x.methodOne.isDelegator,
        "Delegator is destroyed, original method returned to owner"
    );
});

module( "state/realization" );

test( "realize", function () {
	function Class () {}
	state( Class.prototype, {
	    A: state('initial'),
	    B: {}
	});

    var o = new Class;

    ok( o.state() === o.state('A') &&
        o.state().isVirtual(),
        ""
    );

    o.state().realize();
    ok( !o.state().isVirtual(),
        ""
    );

    ok( !o.state('B').isVirtual() &&
        o.state('B').owner() !== o &&
        o.state('B').owner() === Class.prototype,
        "Querying inactive inherited state returns protostate, not virtual state."
    );

    o.state().change('B');
    ok( o.state('B').isVirtual() &&
        o.state('B').owner() === o &&
        o.state('B').owner() !== Class.prototype,
        "Querying active inherited state returns virtual state, not protostate."
    );

    o.state().realize();
    ok( !o.state().isVirtual() &&
        o.state().owner() === o,
        "Virtual state can be realized."
    );
});

module( "state/expression" );

var ref = {}, val = 1,
    expr = {
        data: { a:ref, b:val },

        peek: function () {},
        poke: function () {},

        depart: function () {},
        arrive: [ function () {}, function () {} ],

        admit: true,
        release: function () { return true; },

        A: {
            peek: function () {},
            poke: function () {},

            enter: 'B',
            exit: function () {}
        },
        B: {
            peek: function () {},
            poke: function () {},

            enter: function () {},
            exit: 'A'
        },

        transitions: {
            'Bang!': { origin: 'A', target: 'B', action: function () {
                return this.end( "bang!" );
            }}
        }
    };

test( "Transitivity of `express()`", function () {
    var a = state( {}, expr ).express(),
        b = state( {}, a ).express();

    ok( O.isEqual( a, b ),
        "Output of `express()` can be used to create a new equivalently stateful object."
    );
});

module( "state/mutation" );

var o = {};
state( o, 'mutable', {
    data: { a:1, b:'two' },
    mutate: function ( mutation, delta, before, after ) {
        ok( true, "mutate event at root state" );
    },
    S1: {
        data: { a:3, b:'four' },
        run: function () { return 'foo'; },
        tap: 'S2',
        mutate: function ( mutation, delta, before, after ) {
            ok( true, "mutate event at substate" );
        }
    },
    S2: {
        data: { a:5, b:'six' },
        run: function () { return 'bar'; },
        tap: 'S1'
    }
});

test( "Complimentarity of `express()` / `mutate()`", function () {
    var keys, id, list;

    function f ( n ) {
        return f[n] = function () {};
    }

    id = o.state('S1').on( 'mutate', function ( mutation, delta ) {
        var index = O.keys( delta.events.tap )[0],
            compare = { events: { tap: {} } };

        compare.events.tap[ index ] = O.NIL;

        deepEqual( delta, compare,
            "delta.events.tap[" + index + "]:NIL"
        );
    });
    o.state().mutate({ S1:{ events:{ tap:'S3' } } });
    ok(
        o.state('S1').event('tap') === 2,
        "ok"
    );
    o.state('S1').off( 'mutate', id );

    keys = O.keys( o.state('S1').express().events.tap );
    ok(
        o.state('S1').express().events.tap[ keys[0] ] === 'S2',
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[1] ] === 'S3',
        "ok"
    );

    list = {};
    list[ keys[0] ] = list[ keys[1] ] = O.NIL;
    o.state('S1').mutate({
        events: {
            tap: [ f(0), f(1), f(2), list ]
        }
    });
    ok(
        o.state('S1').event('tap') === 3,
        "ok"
    );

    keys = O.keys( o.state('S1').express().events.tap );
    ok(
        o.state('S1').express().events.tap[ keys[0] ] === f[0],
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[1] ] === f[1],
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[2] ] === f[2],
        "ok"
    );
});

module( "state/attributes" );

( function () {

    function Parent () {}
    state( Parent.prototype, 'abstract retained shallow history', {
        A: state( 'default' ),
        B: state( 'initial' ),
        C: state( 'conclusive', {
            CA: state,
            CB: state( 'final' )
        })
    });

    O.inherit( Child, Parent );
    function Child () {}
    state( Child.prototype, 'concrete' );


    test( "Abstraction", function () {
        var o;

        o = {};
        state( o, {} );
        ok( o.state().isConcrete() &&
            !o.state().isAbstract(),
            "Empty state defaults to `concrete`"
        );

        ok( Parent.prototype.state('').isAbstract() &&
            !Parent.prototype.state('').isConcrete(),
            "`abstract` attribute properly negates `concrete`"
        );

        ok( !Child.prototype.state('').isAbstract() &&
            Child.prototype.state('').isConcrete(),
            "First inheritor has nominally appropriate abstraction"
        );

        o = new Child;
        ok( !o.state('').isAbstract() &&
            o.state('').isConcrete(),
            "Second inheritor has nominally appropriate abstraction"
        );

        o = new Parent;
        state( o, 'abstract concrete', {} );
        ok( !o.state('').isAbstract() &&
            o.state('').isConcrete(),
            "Bad production that includes both causes `abstract` to be negated"
        );

        o = new Child;
        state( o, 'abstract', {} );
        ok( o.state(),
            "Second inheritor overrides abstraction overrides of first inheritor"
        );
        o.state('->');
        ok( o.state().is('A'),
            "Inherited `default` attribute on substate responds properly to overriding literal `abstract` superstate"
        );
    });

    test( "Determination", function () {
        var o = new Parent;

        ok( o.state().is('B') &&
            o.state().isVirtual() &&
            o.state().isInitial(),
            "Initial state of instance inherits `initial` attribute from prototype."
        );

        ok( o.state('').isAbstract() &&
            o.state('').isRetained() &&
            o.state('').isShallow() &&
            o.state('').hasHistory(),
            "Root state of instance inherits attributes "+
            "[ `abstract`, `retained`, `shallow`, `history` ] from prototype."
        );

        o.state('->');
        ok( o.state().is('A') &&
            o.state().isVirtual() &&
            o.state().isDefault(),
            ""
        );

        o.state('-> C');
        o.state('-> B');
        ok( !o.state().is('B') &&
            o.state().is('C') &&
            o.state().isConclusive(),
            "Should disallow transition that exits from `conclusive` state"
        );

        o.state('-> CB');
        ok( o.state().is('CB'),
            "Should allow transition that does not exit from `conclusive` state"
        );

        o.state('-> CA');
        ok( !o.state().is('CA') &&
            o.state().is('CB') &&
            o.state().isFinal(),
            "Should disallow transition that departs from `final` state"
        );
    });

    test( "Behavioral test", function () {
        var o = new Parent;

        ok( o.state().is('B'),
            "Inherits initialization from prototype."
        );

        o.state().go('');
        ok( o.state().is('A'),
            "Inherits abstraction from prototype root and protostate `A`."
        );

        o.state().go('C');
        o.state().go('B');
        ok( o.state().is('C') &&
            ( o.state().go('CA'), o.state().is('CA') ),
            "Inherits conclusivity from protostate `C`."
        );

        o.state().go('CB');
        o.state().go('CA');
        ok( o.state().is('CB'),
            "Inherits finality from protostate `CB`."
        );
    });

}() );
module( "state/model" );

test( "owner", function () {
    var o = {};
    var s = state( o, {} );

    ok( s.owner() === o,
        "ok"
    );
});


( function () {

    function Mock () {
        state( this, {
            A: {
                A: {
                    A: {
                        A: {}
                    }
                },
                B: {}
            },
            B: {
                C: {
                    D: {}
                }
            }
        });
    }

    test( "superstate: common usage", function () {
        var o = new Mock;

        ok( o.state('A.A.A').superstate() === o.state('A.A'),
            "Calling `superstate` with no arguments returns the immediate superstate."
        );
    });

    test( "superstate: special cases", function () {
        var o = new Mock;

        ok( o.state('').superstate() === undefined,
            "Calling from the root state returns `undefined`."
        );
        ok( o.state('D').superstate('*') === undefined,
            "Calling with a nonsensical argument returns `undefined`."
        );
    });

    test( "superstate: resolution of named ancestor argument", function () {
        var o = new Mock;

        ok( o.state('A.A.A').superstate('') === o.state(''),
            "Empty string resolves to the root state."
        );
        ok( o.state('A.A.A').superstate('A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A') !== o.state('A'),
            "Ambiguous name resolves to the nearest ancestor."
        );
        ok( o.state('A.A.A').query('A.A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A.A') === undefined,
            "Argument is expected to be a name, not a selector."
        );
    });

    test( "superstate: additional mocks", function () {
        var x = new TestObject;

        ok( x.state('ReallyDead').superstate('Finished') === x.state('Finished'),
            "`superstate()` resolves "
        );
        ok( x.state('ReallyDead').superstate('') === x.state().root(),
            ""
        );
        ok( x.state('ReallyDead').superstate() === x.state('Terminated'),
            ""
        );
        ok( x.state().root().superstate() === undefined,
            ""
        );
    });

}() );

( function () {

    function Mock () {}
    state( Mock.prototype, {
        A: {
            AA: {}
        },
        B: {}
    });

    O.inherit( Submock, Mock );
    function Submock () {}
    state( Submock.prototype, {
        B: {
            BA: {},
            BB: {}
        },
        C: {}
    });

    test( "protostate: stateful behavior of non-stateful inheritor", function () {
        var o = new Submock;

        ok( o.state('A')  && o instanceof o.state('A') .owner().constructor &&
            o.state('AA') && o instanceof o.state('AA').owner().constructor &&
            o.state('B')  && o instanceof o.state('B') .owner().constructor &&
            o.state('BA') && o instanceof o.state('BA').owner().constructor &&
            o.state('BB') && o instanceof o.state('BB').owner().constructor &&
            o.state('C')  && o instanceof o.state('C') .owner().constructor,
            "Queried states are members of the object itself or one of its prototypes."
        );
        ok( o.state().go('A') &&
            o.state().isVirtual() &&
            o.state().protostate() === Mock.prototype.state('A'),
            "Reaches past lower prototypes that do not contain a matching protostate."
        );
    });

}() );

( function () {
    // A taxonomy is modeled with stateful objects employing standard prototypal inheritance.

    function Animal () {}
    Animal.prototype.move = function () { return 0; };
    state( Animal.prototype, {
        getThis: function () { return this; },

        Stationary: state( 'initial', {
            getThis: function () { return this; },
            move: function () { return false; }
        }),
        Moving: {
            move: function () { return true; }
        }
    });

    test( "protostate: first inheritor", function () {
        var animal = new Animal;

        ok( animal.move() === false,
            ""
        );

        ok( animal.getThis() === animal.state('Stationary'),
            ""
        );

        animal.state('-> Moving');
        ok( animal.move() === true,
            ""
        );

        animal.state('->');
        ok( animal.move() === 0,
            ""
        );
    });

    O.inherit( Bird, Animal );
    function Bird () {}
    state( Bird.prototype, {
        Moving: {
            Flying: {
                move: function () { return 'Flap flap'; }
            },
            Ambulating: {
                move: function () { return 'Waddle waddle'; }
            }
        }
    }, 'Stationary' );

    test( "protostate: second inheritor", function () {
        var bird = new Bird;
        ok( bird.constructor === Bird );

        var prototype = bird.constructor.prototype;
        ok( prototype instanceof Animal && !( prototype instanceof Bird ) );

        var protostate = bird.state().root().protostate();
        ok( protostate );
        ok( protostate.owner() === prototype );
        ok( protostate.controller().root() === protostate );

        ok( bird.move() === false,
            ""
        );
        ok( bird.getThis() === bird.state('Stationary'),
            ""
        );

        bird.state('-> Moving');
        ok( bird.move() === true,
            "Method is inherited through the immediate protostate."
        );

        bird.state('-> Flying');
        ok( bird.move() === "Flap flap",
            ""
        );

        bird.state('-> Ambulating');
        ok( bird.move() === "Waddle waddle",
            ""
        );

        bird.state('-> ..');
        ok( bird.move() === true,
            ""
        );

        bird.state('-> Stationary');
        ok( bird.move() === false,
            ""
        );
        bird.state('->');
        ok( bird.move() === 0,
            ""
        );
    });

    O.inherit( Ostrich, Bird );
    function Ostrich () {}
    state( Ostrich.prototype, {
        Stationary: {
            HeadBuried: {
                move: function () { return 'Buttwiggle'; }
            }
        },
        Moving: {
            Flying: {
                move: function () {}
            },
            Ambulating: {
                Walking: {
                    move: function () { return 'Stomp stomp'; }
                },
                Running: {
                    move: function () { return 'Thumpthumpthumpthump'; }
                }
            },
            Kicking: {
                move: function () { return 'Pow!'; }
            }
        }
    });

    test( "protostate third inheritor", function () {
        var ostrich = new Ostrich;
        strictEqual( ostrich.move(), false );

        ostrich.state('-> Moving');
        ok( ostrich.move() === true,
            ""
        );

        ostrich.state('-> .Flying');
        ok( ostrich.move() === undefined,
            ""
        );

        ostrich.state('-> ..Ambulating');
        ok( ostrich.move() === "Waddle waddle",
            ""
        );

        ostrich.state('-> .Walking');
        ok( ostrich.move() === "Stomp stomp",
            ""
        );

        ostrich.state('-> ..Running');
        ok( ostrich.move() === "Thumpthumpthumpthump",
            ""
        );

        ostrich.state('-> ....Stationary.HeadBuried');
        ok( ostrich.move() === "Buttwiggle",
            ""
        );

        ostrich.state('-> Moving.Kicking');
        ok( ostrich.move() === "Pow!",
            ""
        );
    });

}() );


test( "isIn", function () {
    var x = new TestObject;

    ok( x.state('Waiting').isIn( x.state().root() ) );
    ok( x.state('Waiting').isIn('') );
    ok( x.state('CleaningUp').isIn('') );
    ok( x.state('CleaningUp').isIn( x.state('Finished') ) );
    ok( !x.state('CleaningUp').isIn( x.state('Waiting') ) );
    ok( x.state('Finished').isIn( x.state('Finished') ) );
    ok( !x.state('Finished').isIn( x.state('CleaningUp') ) );
    ok( !x.state('Finished').isIn('CleaningUp') );
    ok( x.state('CleaningUp').isIn('.') );
});

test( "isSuperstateOf", function () {
    var x = new TestObject;

    ok( x.state().root().isSuperstateOf('Waiting') );
    ok( x.state().root().isSuperstateOf('CleaningUp') );
    ok( x.state('Finished').isSuperstateOf('CleaningUp') );
    ok( !x.state('Finished').isSuperstateOf('Active') );
});

test( "substates", function () {
    var x = new TestObject;
    var states = x.state().root().substates( true );

    ok( states.length === 8 );
});

( function () {

    function Foo () {}
    state( Foo.prototype, {
        Buzzy: {},
        Fizzy: state('initial')
    });

    O.inherit( Bar, Foo );
    function Bar () {}
    state( Bar.prototype, {
        Fizzy: state( 'initial', {
            Fuzzy: state('initial')
        })
    });

    O.inherit( Baz, Bar );
    function Baz () {}
    state( Baz.prototype, {
        Bzzt: {
            Bzzzzt: state('initial')
        },
        Buzzy: state( 'initial', {
            Bizzy: state('initial'),
            Bazzy: state('initial')
        })
    });

    O.inherit( Qux, Baz );
    function Qux () {}
    state( Qux.prototype, {
        Wizzy: {
            Wuzzy: {}
        }
    });

    test( "initialSubstate: resolution of `initial` attribute", function () {
        ok( Foo.prototype.state() === Foo.prototype.state('Fizzy') &&
            Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy') &&
            Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy'),
            "Resolves explicit `initial` attribute."
        );

        ok( Qux.prototype.state().isVirtual() &&
            Qux.prototype.state().root().initialSubstate() === Qux.prototype.state('Bizzy') &&
            Qux.prototype.state().protostate() === Baz.prototype.state(),
            "Inheritor with no state marked `initial` inherits initialization from its "+
            "prototype."
        );
    });

    test( "initialSubstate: resolution through nested `initial` attributes", function () {
        ok( Bar.prototype.state() !== Bar.prototype.state('Fizzy'),
            ""
        );
        ok( Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy'),
            ""
        );
    });

    test( "initialSubstate: resolution of `initial` attribute within a malformed state expression", function () {
        ok( Baz.prototype.state() !== Baz.prototype.state('Bzzt.Bzzzzt'),
            "Breadth-first: precedence falls to higher-ranked state marked `initial`."
        );
        ok( Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy') &&
            Baz.prototype.state() !== Baz.prototype.state('Buzzy.Bazzy'),
            "Multiple `initial` attributes resolve to the first-encountered state marked "+
            "`initial`."
        );
    });

    test( "initialSubstate: inheritance of `initial` attribute", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        ok( foo.state().name() === 'Fizzy',
            "Inheriting instance initializes to the current state of its prototype."
        );
        ok( bar.state().name() === 'Fuzzy',
            ""
        );
        ok( baz.state().name() === 'Bizzy',
            ""
        );
        ok( qux.state().name() === 'Bizzy',
            ""
        );
    });

    test( "initialSubstate: ", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        foo.state().change('Buzzy');
        ok( foo.state().name() === 'Buzzy',
            ""
        );

        bar.state().change('Buzzy');
        ok( bar.state().name() === 'Buzzy',
            ""
        );

        baz.state().change('Fizzy');
        ok( baz.state().name() === 'Fizzy',
            ""
        );

        qux.state().change('Fizzy');
        ok( qux.state().isVirtual(),
            ""
        );
        ok( qux.state().name() === 'Fizzy',
            ""
        );
    });
}() );

test( "depth", function () {
    var x = new TestObject;
    equal( x.state().root().depth(), 0 );
    equal( x.state('Finished.Terminated').depth(), 2 );
});

test( "common", function () {
    var x = new TestObject;

    ok( x.state('Terminated').common( x.state('Finished') ) === x.state('Finished'),
        ""
    );
    ok( x.state('Terminated').common( x.state('CleaningUp') ) === x.state('Finished'),
        ""
    );
    ok( x.state('Terminated').common( x.state('Active') ) === x.state().root(),
        ""
    );
    ok( x.state().root().common( x.state().root() ) === x.state().root(),
        ""
    );
    ok( x.state('Active').common( x.state('Terminated') ) === x.state().root(),
        ""
    );
    ok( x.state('Waiting').common( x.state('Waiting') ) === x.state('Waiting'),
        ""
    );
    ok( x.state('Finished').common( x.state('CleaningUp') ) === x.state('Finished'),
        ""
    );
});


module( "state/query" );

test( "Aliases", function () {
    var s = state({},{});

    ok( typeof s.query === 'function' &&
        s.query === s.match,
        "Alias `match` is provided."
    );
});

test( "Special cases", function () {
    var o = {};
    state( o, {
        A: {},
        B: {
            BA: {
                BAA: {}
            },
            BB: {},
            BC: {
                BCA: {},
                BCB: {}
            }
        }
    });

    ok( o.state( null ) === null &&
        o.state( undefined ) === null &&
        o.state().query( null, o.state('') ) === false &&
        o.state().query( null, "randomstring" ) === false &&
        o.state().query( null, null ) === false &&
        o.state().query( null, undefined ) === null,
        "Null selector returns null and matches nothing."
    );
    ok( o.state('') === o.state().root() &&
        o.state('A').query('') === o.state().root(),
        "Empty string selector resolves to the root state."
    );
    ok( O.isEqual( o.state('*'), [ o.state('A'), o.state('B') ] ),
        "Absolute single-wildcard selector returns an array of the immediate substates."
    );
    ok( O.isEqual( o.state('**'), [
            o.state('A'),
            o.state('B'),
            o.state('BA'),
            o.state('BAA'),
            o.state('BB'),
            o.state('BC'),
            o.state('BCA'),
            o.state('BCB')
        ]),
        "Absolute double-wildcard selector returns a flattened depth-first array of all "+
        "descendants."
    );
    ok( o.state().query( '*', o.state('') ) &&
         o.state().query( '*', o.state('B') ) &&
        !o.state().query( '*', o.state('BA') ),
        "Absolute single-wildcard selector matches the root state and its immediate "+
        "substates, but no further."
    );
    ok( o.state().query( '**', o.state('') ) &&
        o.state().query( '**', o.state('B') ) &&
        o.state().query( '**', o.state('BA') ) &&
        o.state().query( '**', o.state('BAA') ),
        "Absolute double-wildcard selector matches any state in the tree."
    );
    ok( !o.state().query( '.*', o.state('') ) &&
         o.state().query( '.*', o.state('B') ) &&
        !o.state().query( '.*', o.state('BA') ) &&
         o.state('B').query( '.*', o.state('BA') ) &&
        !o.state('B').query( '.*', o.state('BAA') ),
        "Relative single-wildcard selector matches the local state's immediate substates."
    );
});

test( "Disambiguation", function () {
    var o = {};
    state( o, {
        A: state( 'initial', {
            B: {},
            D: {
                E: {}
            }
        }),
        B: {},
        C: {
            D: {},
            E: {}
        }
    });
    ok( o.state('B').superstate() === o.state('') &&
        o.state('B').superstate() !== o.state('A'),
        "Absolute selector gives precedence to the higher-ranked state."
    );
    ok( o.state('.B') === o.state('A.B') &&
        o.state('.B') !== o.state('B'),
        "Relative selector gives precedence to the descendant of the current state."
    );
    o.state('->');
    ok( o.state('.B') === o.state('B'),
        "Relative selector disambiguates differently as the current state changes."
    );
    ok( o.state('.D').superstate() !== o.state('') &&
        o.state('.D') === o.state('A.D') &&
        o.state('.D') !== o.state('C.D'),
        "Relative selector with no local match is recursed to descendants."
    );
    ok( o.state('.E') === o.state('C.E') &&
        o.state('.E') !== o.state('A.D.E'),
        "Relative selector with no local match recursively descends breadth-first."
    );
    o.state('-> A');
    ok( o.state('.C').superstate() === o.state(''),
        "Relative selector with no local or descendant match is recursed to the superstate."
    );
});

test( "Resolution across ambiguously named nested states", function () {
    var o = {};
    state( o, {
        A: {
            A: {
                A: {
                    A: {}
                }
            }
        }
    });

    ok( o.state('A').query('.A') === o.state('A.A') &&
        o.state('A.A').query('.A') === o.state('A.A.A') &&
        o.state('A.A.A').query('.A') === o.state('A.A.A.A') &&
        o.state('A.A.A.A').query('.A') === o.state('A.A.A.A') &&
        o.state('A.A.A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A.A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A').query('.A.A') === o.state('A.A.A'),
        ""
    );
});

test( "Additional mock tests", function () {
    var x = new TestObject;
    ok( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ) );
    ok( x.state().query( 'Finished.*', x.state('Finished.Terminated') ) );
    ok( !x.state().query( 'Finished.*', x.state('Waiting') ) );
    ok( !x.state().query( 'Finished.*', x.state('Finished') ) );
    ok( x.state('Finished').query( '.Terminated', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.CleaningUp') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
    ok( x.state().query( '*', x.state('Finished') ) );
    ok( !x.state().query( '*', x.state('Finished.Terminated') ) );
    ok( x.state().query( '**', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.**', x.state('Finished.Terminated') ) );

    strictEqual( x.state().query( 'Finished' ), x.state('Finished') );
    strictEqual( x.state().query( '*' ).length, 3 );
    strictEqual( x.state().query( '**' ).length, 8 );
    strictEqual( x.state('Finished').query( '.Terminated' ), x.state('Finished.Terminated') );
    strictEqual( x.state('Finished').query( '.*' ).length, 2 );
    strictEqual( x.state().query( '*', x.state('Finished') ), true );
    strictEqual( x.state().query( '*', x.state('Finished.CleaningUp') ), false );
    strictEqual( x.state().query( '**', x.state('Finished.CleaningUp') ), true );
    strictEqual( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ), true );
    strictEqual( x.state().query( 'Finished.*', x.state('Finished.Terminated') ), true );

    x.state('-> Waiting');
    ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
    ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
    x.state('->');
    ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
    ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
    x.state('-> Tweaked');
});

module( "state/data" );

test( "Data", function () {
    var NIL = O.NIL;

    function Class () {
        state( this, 'mutable', {
            data: {
                a: 1,
                b: "2",
                c: [ 3, "4", { 5: "foo" } ],
                d: {},
                e: {
                    f: 6,
                    g: "7",
                    h: [ 8, 9 ]
                }
            },
            State1: {
                data: {
                    b: 2,
                    c: [ undefined, undefined, { 5: "bar" } ]
                }
            },
            State2: {
                data: {}
            }
        });
    }
    state( Class.prototype, {
        mutate: function ( mutation, delta, after, before ) {
            ok( true, "mutate event" );
        }
    });

    var o = new Class;

    ok( o.state().data(),
        "Data accessible from `data()`"
    );
    ok( o.state('').data().a === o.state('State1').data().a,
        "Substate data inherits primitive-typed data member from superstate"
    );
    ok( o.state('').data().b !== o.state('State1').data().b,
        "Substate data overrides primitive-typed data member of superstate"
    );
    ok( o.state('State1').data().c[1] === "4",
        "Substate data inherits data member from superstate through own sparse array"
    );

    o.state('').data({
        a: NIL,
        d: { a: 1 },
        e: {
            g: NIL,
            h: [ undefined, "nine" ]
        }
    });
    deepEqual( o.state('').data(),
        {
            b: "2",
            c: [ 3, "4", { 5: "foo" } ],
            d: { a: 1 },
            e: { f: 6, h: [ 8, "nine" ] }
        },
        ""
    );
    deepEqual( o.state('State1').data(),
        {
            b: 2,
            c: [ 3, "4", { 5: "bar" } ],
            d: { a: 1 },
            e: { f: 6, h: [ 8, "nine" ] }
        },
        ""
    );

    expect( 7 );
});

module( "state/methods" );

test( "Method resolutions", function () {
    var x = new TestObject('');
    var result;


    //
    ok( x.methodOne() === 'methodOne'
    );
    
    ok( x.methodTwo() === 'methodTwo'
    );


    //
    x.state('-> Waiting');
    ok( x.state().is('Waiting'),
        "State 'Waiting'"
    );
    
    ok( x.methodOne() === 'Waiting.methodOne'
    );
    
    ok( x.methodTwo() === 'methodTwo'
    );


    //
    x.state('-> Active');
    ok( x.state().is('Active'),
        "State 'Active'"
    );
    
    ok( x.methodOne() === 'methodOne'
    );

    ok( x.methodTwo() === 'Active.methodTwo'
    );


    //
    result = x.state('-> Finished');
    ok( result,
        "State 'Finished'"
    );

    ok( !x.state().is('Finished'),
        "Transition to `Finished` is asynchronous"
    );
    
    // `!==` because change('Finished') is an async transition
    ok( x.methodOne() !== 'Finished.methodOne'
    );

    // `===` because `methodTwo` isn't overridden by `Finished`
    ok( x.methodTwo() === 'methodTwo'
    );

    // `!==` for the same reason
    ok( x.methodThree(1,2) !== 'Finished.methodThree uno=1 dos=2'
    );


    //
    x.state('-> CleaningUp');
    ok( x.state().is('CleaningUp'),
        "State 'Finished.CleaningUp'"
    );

    ok( x.methodOne() === 'Finished.methodOne'
    );

    ok( x.methodTwo() === 'Finished.CleaningUp.methodTwo'
    );


    //
    x.terminate();
    ok( x.state().is('Terminated'),
        "State 'Finished.Terminated'"
    );

    ok( x.methodOne() === 'Finished.methodOne'
    );

    ok( x.methodTwo() === 'Finished.Terminated.methodTwo'
    );

    ok( x.methodThree(1,2) ===
            'Finished.Terminated.methodThree : Finished.methodThree uno=1 dos=2'
    );
});

module( "state/guards" );

test( "Guards", function () {
    var x = new TestObject('Finished');
    
    x.state('-> Waiting');
    ok( !x.state().is('Waiting'),
        "'Finished' to 'Waiting' disallowed"
    );

    x.state('-> Active');
    ok( !x.state().is('Active'),
        "'Finished' to 'Active' disallowed"
    );

    x.state('-> .Terminated');
    ok( x.state().is('Terminated'),
        "'Finished' to 'Finished.Terminated' allowed"
    );

    x.state('->');
    ok( !x.state().is(''),
        "'Finished.Terminated' to root state disallowed"
    );
});

module( "StateController" );

test( "change()", function () {
    var x = new TestObject('');
    var result;

    // This state change attempt should succeed, so the `success` callback in
    // `change()` should be called.
    x.state('-> Waiting', {
        success: function () { result = true; }
    });
    ok( result === true,
        "Callback to success function"
    );
    result = undefined;

    // A state change from `Terminated` to the root state should fail by order
    // of the `release` guard of `Terminated`, so the `failure` callback
    // provided to `change()` should be called.
    x.state('-> Terminated');
    x.state('->', {
        failure: function () { result = false; }
    });
    ok( result === false,
        "Callback to failure function"
    );
    result = undefined;

    // A `forced` state change attempt should succeed despite being disallowed.
    x.state('-> Waiting', {
        forced: true,
        success: function () { result = true; }
    });
    ok( result === true,
        "Callback to success function"
    );
    result = undefined;
});

test( "change() bubble/capture", function () {
    var x = new TestObject('Waiting');
    var out = '';

    x.state('Waiting').on( 'exit', function () { out += "fee"; } );
    x.state('Finished').on( 'enter', function () { out += "fi"; } );
    x.state('CleaningUp').on( 'enter', function () { out += "fo"; } );
    
    x.state('-> CleaningUp');
    ok( out === "feefifo",
        "ok"
    );
});

test( "Null state change", function () {
    var x = new TestObject;
    var current = x.state();
    var out = '';

    current.on( 'depart', function () { out += "fee"; } );
    current.on( 'exit'  , function () { out += "fi";  } );
    current.on( 'enter' , function () { out += "fo";  } );
    current.on( 'arrive', function () { out += "fum"; } );

    x.state().change( current );
    ok( x.state().is( current ),
        "current state remains current"
    );
    ok( out === 'feefum',
        "Emits `depart` and `arrive` but not `enter` and not `exit`"
    );
});

test( "Simple state change", function () {
    var x = new TestObject;

    ok( x.state('-> Active'),
        "Change to state 'Active'"
    );
    ok( x.state('-> Finished'),
        "Change to state 'Finished'"
    );
    ok( x.state('->'),
        "Change to root state"
    );
});

test( "State changes from parent state into child state", function () {
    var x = new TestObject('');
    var result;

    ok( x.state().is(''), "Initialized to root state"
    );

    result = x.state('-> Finished');
    ok( result,
        "Changed to state 'Finished' " + result.toString()
    );

    x.state('-> .CleaningUp');
    ok( x.state().is('CleaningUp'),
        "Changed to child state 'CleaningUp' using relative selector syntax"
    );
});

test( "State changes from one child state sibling to another", function () {
    var x = new TestObject('Finished');
    var s;

    ok( x.state().is('Finished'),
        "Initialized to state 'Finished'"
    );

    s = x.state('-> Finished');
    ok( x.state('-> CleaningUp'),
        "Aborted transition redirected to child state"
    );

    ok( x.state('-> ..Terminated'),
        "Change to sibling state using relative selector syntax"
    );
});

test( "Transitional event that causes transition abortion", function () {
    var o = {};
    state( o, {
        A: {
            enter: function () { this.$('-> B'); }
        },
        B: state
    });

    o.state('-> A');
    ok( o.state().is('B'),
        "Transition redirected by a transitional event"
    );
});

1&&
( function ( $, assert, undefined ) {

module( "StateEvent" );

test( "String as transition target", function () {
    var o = {};
    state( o, {
        A: { events: { foo: 'B' } },
        B: { events: { bar: 'A' } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

test( "String as transition target as last element in Array", function () {
    var o = {};
    state( o, {
        A: { events: { foo: [ function () { return 'aString'; }, 'B' ] } },
        B: { events: { bar: [ function () { return 'aString'; }, 'A' ] } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

test( "Transition executed after callbacks", 4, function () {
    function fn () { assert.ok( o.state() === this ); }
    var o = {};
    state( o, {
        A: { events: { foo: [ 'B', fn ] } },
        B: { events: { bar: [ 'A', fn ] } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

test( "Deterministic FSM", function () {
    function IsDivisibleByThreeComputer () {
        state( this, 'abstract', {
            s0: state( 'initial default',
                { events: { '0':'s0', '1':'s1' } } ),
            s1: { events: { '0':'s2', '1':'s0' } },
            s2: { events: { '0':'s1', '1':'s2' } }
        });
    }
    IsDivisibleByThreeComputer.prototype.compute = function ( number ) {
        var i, l, binary = number.toString(2);
        this.state().go('s0');
        for ( i = 0, l = binary.length; i < l; i++ ) {
            this.state().emit( binary[i] );
        }
        return this.state().is('s0');
    }

    var three = new IsDivisibleByThreeComputer;
    assert.equal( three.compute(8), false );
    assert.equal( three.compute(78), true );
    assert.equal( three.compute(1000), false );
    assert.equal( three.compute(504030201), true );
});

})( jQuery, QUnit || require('assert') );
( function ( $, assert, undefined ) {

module( "state.method" );

var Superclass = ( function () {
  function Superclass () {}

  O.assign( Superclass.prototype, {
    foo: "FOO", bar: "BAR",
    m: function () { return this.foo; }
  });
  
  state( Superclass.prototype, {
    autostate: state.method( function () { return autostate; } ),
    protostate: state.method( function () { return protostate; } ),

    A: {
      autostate: state.method( function () { return autostate; } ),
      protostate: state.method( function () { return protostate; } ),

      m: state.method( function () {
        return superstate.call('m') + owner.bar;
      }),
      AA: state
    }
  });

  return Superclass;
}() );

var Class = ( function () {
  O.inherit( Class, Superclass );
  function Class () {}

  O.assign( Class.prototype, {
    baz: "BAZ"
  });

  state( Class.prototype, {
    autostate: state.method( function () { return autostate; } ),
    protostate: state.method( function () { return protostate; } ),

    A: {
      autostate: state.method( function () { return autostate; } ),
      protostate: state.method( function () { return protostate; } ),

      m: state.method( function () {
        return protostate.call('m') + owner.baz;
      })
    }
  });

  return Class;
}() );


/////////////////////

test( "method", function () {
  var o = new Class;

  assert.ok( o.autostate() === Class.prototype.autostate() );
  assert.ok( o.autostate().protostate() === Superclass.prototype.autostate() );
  assert.ok( o.protostate() === Class.prototype.protostate() );
  assert.ok( o.protostate().protostate() === Superclass.prototype.protostate() );
  assert.ok( o.protostate().protostate() === undefined );

  assert.ok( o.m() === "FOO" );
  
  
  o.state('-> A');

  assert.ok(
    o.autostate() !==
    Class.prototype.autostate()
  );
  assert.ok(
    o.autostate() ===
    Class.prototype.state('A').call('autostate')
  );
  assert.ok(
    o.autostate().protostate() ===
    Superclass.prototype.state('A').call('autostate')
  );
  assert.ok(
    o.protostate() ===
    Class.prototype.state('A').call('protostate')
  );
  assert.ok(
    o.protostate().protostate() ===
    Superclass.prototype.state('A').call('protostate')
  );
  assert.ok(
    o.protostate().protostate() === undefined
  );

  assert.ok( o.m() === "FOOBARBAZ" );
})


}( jQuery, QUnit ) );
( function () {
	var io = {
		write: function () {}
	};

	var owner = function () {
		return this.owner();
	};

	var TextDocument = ( function() {

		function TextDocument ( url ) {
			var text;
			this.url = url;
			text = '';
			this.text = function () {
				return text;
			};
			this.edit = function ( newText ) {
				text = newText;
				return this;
			};
			this.state();
		}

		TextDocument.prototype.save = function () {
			io.write( this.url, this.text() );
			return this;
		};

		state( TextDocument.prototype, {
			test: function () {
				return console.log( this.name() );
			},
			freeze: function () {
				var result;
				result = this.owner().save();
				this.change('Saved.Frozen');
				return result;
			},
			Saved: state( 'initial', {
				edit: state.method( function ( newText ) {
					var result;
					result = superstate.call( 'edit', newText );
					this.change('Dirty');
					return result;
				}),
				save: owner,
				enter: function () {},
				exit: function () {},
				Frozen: state( 'final sealed', {
					edit: owner,
					freeze: owner,
					arrive: function () {}
				})
			}),
			Dirty: {
				save: state.method( function () {
					var result;
					result = this.superstate().call('save');
					this.change('Saved');
					return result;
				})
			}
		});

		return TextDocument;

	})();

	this.TextDocument = TextDocument;
})();

1&&
( function ( assert ) {

module( "TextDocument" );

test( "TextDocument", function () {
	var	doc1 = new TextDocument,
		doc2 = new TextDocument;

	doc1.state().go('Saved');
	doc2.state().go('Saved');
	assert.ok(
		doc1.state().is('Saved'),
		"Initial state active"
	);
	
	doc1.edit('foo');
	assert.ok(
		doc1.state().is('Dirty'),
		"Edit causes transition from 'Saved' to 'Dirty'"
	);
	
	doc1.freeze();
	assert.ok(
		doc1.state().is('Frozen'),
		"`freeze` callable from 'Dirty', causes transition to 'Saved.Frozen'"
	);
});

})( QUnit );