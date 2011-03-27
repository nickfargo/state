var State = $.extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			// ( Object ) => State.Definition( map )
			// ( Object, Object ) => State.Controller( owner, map )
			// ( Object, Object, String ) => State.Controller( owner, map, initialState )
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		if ( !( definition instanceof State.Definition ) ) {
			definition = State.Definition( definition );
		}
		
		var	state = this,
			methods = {},
			events = {},
			rules = {},
			substates = [],
			getName;
		
		// deprivatize these for now to allow visibility to inspectors
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		$.extend( this, {
			// this idiom keeps the value readonly while exposing it directly on the accessor function, useful for inspectors
			name: ( getName = function () { return name || ''; } ).toString = getName,
			superstate: function () { return superstate; },
			method: function ( methodName ) {
				return (
					methods[ methodName ]
						||
					( superstate && superstate.method( methodName ) )
						||
					undefined
				);
			},
			hasMethod: function ( methodName, deep ) {
				return (
					methodName in methods
						||
					deep && superstate && superstate.hasMethod( methodName, deep )
				);
			},
			addMethod: function ( methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner();
				if ( !this.hasMethod( methodName, true ) ) {
					if ( superstate && owner[ methodName ] !== undefined ) {
						defaultState.addMethod( methodName, owner[ methodName ] );
					}
					owner[ methodName ] = function () {
						var method = controller.getMethod( methodName );
						return method ? method.apply( owner, arguments ) : undefined;
					}
				}
				return ( methods[ methodName ] = fn );
			},
			removeMethod: function ( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			addEventListener: function ( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.add( fn );
			},
			removeEventListener: function ( eventType, id ) {
				return events[ eventType ].remove( id );
			},
			getEventListener: function ( eventType, id ) {
				return events[ eventType ].get( id );
			},
			getEventListeners: function ( eventType ) {
				return events[ eventType ];
			},
			triggerEvents: function ( eventType, data ) {
				if ( events[ eventType ] ) {
					return events[ eventType ].trigger( data );
				} else {
					throw new Error( "Invalid event type" );
				}
			},
			rule: function ( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			addState: function ( stateName, stateDefinition ) {
				var	substate = this[ stateName ] = new State( this, stateName, stateDefinition );
				substates.push( substate );
				return substate;
			},
			removeState: function ( stateName ) {
				// throw new Error( "Not implemented" );
				
				var	substate = substates[ stateName ],
					controller,
					current;
				if ( substate ) {
					controller = this.controller();
					current = controller.currentState();
					// if controller is inside `substate`, eject to `this`
					if ( controller.isInState( substate ) ) {
						controller.changeState( this, { forced: true } );
					}
					delete substates[ stateName ];
					return substate;
				}
			},
			substates: function ( deep ) {
				if ( deep ) {
					var result = [];
					for ( var i in substates ) {
						result = result.concat( substates[i], substates[i].substates( true ) );
					}
					return result;
				} else {
					return substates.slice();
				}
			}
		});
		
		// Create an event collection for each supported event type
		$.each( [ 'enter', 'leave', 'capture', 'bubble' ], function ( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		$.each({
			methods: function ( methodName, fn ) {
				state.addMethod( methodName, fn );
			},
			events: function ( eventType, fn ) {
				if ( $.isArray( fn ) ) {
					$.each( fn, function ( i, fn ) {
						state.addEventListener( eventType, fn );
					});
				} else {
					state.addEventListener( eventType, fn );
				}
			},
			rules: function ( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			states: function ( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			}
		}, function ( i, fn ) {
			if ( definition[i] ) {
				$.each( definition[i], fn );
			}
		});
	}, {
		prototype: {
			toString: function () {
				return ( this.superstate() ? this.superstate() + '.' : '' ) + this.name();
			},
			controller: function () {
				return this.superstate().controller();
			},
			depth: function () {
				for ( var count = 0, state = this; state.superstate(); count++, state = state.superstate() );
				return count;
			},
			common: function ( other ) {
				var state;
				for ( ( this.depth() > other.depth() ) ? ( state = other, other = this ) : ( state = this );
						state;
						state = state.superstate() ) {
					if ( state === other || state.isSuperstateOf( other ) ) {
						return state;
					}
				}
			},
			isSuperstateOf: function ( state ) {
				var superstate = state.superstate();
				return superstate ? ( this === superstate || this.isSuperstateOf( superstate ) ) : false;
			},
			select: function () {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
			},
			// deprecated
			allowLeavingTo: function ( toState ) {
				return true;
			},
			// deprecated
			allowEnteringFrom: function ( fromState ) {
				return true;
			},
			evaluateRule: function ( ruleName, testState ) {
				var	state = this,
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					$.each( rule, function ( selector, value ) {
						$.each( selector.split(','), function ( i, expr ) {
							if ( state.match( $.trim( expr ), testState ) ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
				}
				return ( result === undefined ) || result;
			},
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					locus = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					result;
				
				if ( parts.length ) {
					$.each( parts, function ( i, name ) {
						if ( name === '' ) {
							locus = locus.superstate();
						} else if ( locus[ name ] instanceof State ) {
							locus = locus[ name ];
						} else if ( name == '*' ) {
							result = testState ? locus === testState.superstate() : locus.substates();
							return false;
						} else if ( name == '**' ) {
							result = testState ? locus.isSuperstateOf( testState ) : locus.substates( true );
							return false;
						} else {
							return result = false;
						}
					});
					return (
						result !== undefined ? result :
						!testState || locus === testState ? locus :
						false
					);
				} else {
					return locus;
				}
			}
		}
	}
);
