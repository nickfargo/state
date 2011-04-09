var State = $.extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			// ( Object ) => State.Definition( map )
			// ( Object, Object ) => State.Controller( owner, map )
			// ( Object, Object, String ) => State.Controller( owner, map, initialState )
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		var	state = this,
			destroyed = false,
			methods = {},
			events = {},
			rules = {},
			// substates = [], // TODO: {}
			substates = {},
			getName, getFullName;
		
		// deprivatize these for now to allow visibility to inspectors
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		$.extend( this, {
			superstate: function () { return superstate; },
			
			/**
			 * Returns an object array of this state's superstate chain, starting after the default state and ending at `this`.
			 * 
			 * @param byName:Boolean  Returns a string array of the states' names, rather than references
			 */
			derivation: function ( byName ) {
				for ( var result = [], s, ss = this; ( s = ss ) && ( ss = s.superstate() ); ss && result.unshift( byName ? s.name() || '' : s ) );
				return result;
			},
			
			/**
			 * Returns the **protostate**, the state analogous to `this` found in the next object in the owner's prototype chain that
			 * has one. A state inherits from both its protostate and superstate, *in that order*.
			 * 
			 * If the owner does not share an analogous `StateController` with its prototype, or if no protostate can be found in the
			 * hierarchy of the prototype's state controller, then the search is iterated up the prototype chain.
			 * 
			 * Points of fact:
			 * (1) A state and its protostate will always share an identical name and identical derivation pattern.
			 * (2) The individual superstates of both a state and its protostate will also adhere to point (1).
			 */
			protostate: function () { //// untested
				var	derivation = this.derivation( true ),
					controller = this.controller(),
					controllerName = controller.name(),
					owner = controller.owner(),
					proto = owner,
					s, ps;
				
				function iterateProto () {
					proto = proto.__proto__ || proto.constructor.prototype,
					ps = proto && proto.hasOwnProperty( controllerName ) && proto[ controllerName ] instanceof State.Controller ?
						proto[ controllerName ].defaultState() :
						undefined;
				}
				
				for ( iterateProto(); ps; iterateProto() ) {
					for ( s in derivation ) {
						if ( !( ps = ps[ derivation[s] ] ) ) {
							break;
						}
					}
					if ( ps ) {
						return ps;
					}
				}
			},
			
			// directly expose the value while keeping it readonly (a convenience for viewing in Chrome inspector)
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			fullName: ( getFullName = function () {
				var d = this.derivation();
				return d && d.join('.') || '';
			} ).toString = getFullName,
			
			definition: function () { return definition; },
			
			build: function ( definitionOverride ) {
				definitionOverride && ( definition = definitionOverride );
				definition instanceof State.Definition || ( definition = State.Definition( definition ) );
				// TODO: (???) destroy()
				$.each(
					{
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
					},
					function ( i, fn ) {
						if ( definition[i] ) {
							$.each( definition[i], fn );
						}
					}
				);
				return this;
			},
			
			// TODO: add argument `controller`
			method: function ( methodName, viaSuper, viaProto ) {
				var protostate;
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				// return methods[ methodName ] || ( deep && superstate && superstate.method( methodName, true ) ) || undefined;
				
				return (
					methods[ methodName ]
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && superstate && superstate.method( methodName, true, viaProto )
				);
			},
			
			// // TODO: default `deep` to true, or add method `hasOwnMethod()`
			// hasMethod: function ( methodName, viaSuper, viaProto ) {
			// 	var protostate;
			// 	return (
			// 		methodName in methods
			// 			||
			// 		viaProto && ( protostate = this.protostate() ) && protostate.hasMethod( methodName, false, true )
			// 			||
			// 		viaSuper && superstate && superstate.hasMethod( methodName, true, viaProto )
			// 	);
			// },
			// hasMethod_OLD: function ( methodName, deep ) {
			// 	return methodName in methods || ( deep && superstate && superstate.hasMethod_OLD( methodName, true ) );
			// },
			
			addMethod: function ( methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner();
				// if ( !this.hasMethod( methodName, true ) != !this.hasMethod_OLD( methodName, true ) ) {
				// 	debugger;
				// }
				if ( !this.method( methodName, true, false ) ) {
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
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.trigger( data );
			},
			
			rule: function ( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			
			addState: function ( stateName, stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller && controller.defaultState() === this && ( controller[ stateName ] = substate );
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
					// evacuate before removing
					if ( controller.isInState( substate ) ) {
						controller.changeState( this, { forced: true } );
					}
					delete substates[ stateName ];
					return substate;
				}
			},
			
			substate: function ( stateName ) { //// untested
				var protostate;
				return substates[ stateName ] || ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined );
			},
			
			// TODO: rewrite to consider protostates
			substateCollection: function ( deep ) { //// untested
				var result = [], i;
				for ( i in substates ) {
					result.push( substates[i] );
					deep && ( result = result.concat( substates[i].substateCollection( true ) ) );
				}
				return result;
			},
			
			destroy: function () {
				var	controller = this.controller(),
					transition = controller.transition(),
					origin,
					destination;
				if ( transition ) {
					origin = transition.origin();
					destination = transition.destination();
					if (
						this === origin || this.isSuperstateOf( origin )
							||
						this === destination || this.isSuperstateOf( destination )
					) {
						// TODO: defer destroy() until transition finish()
						return false;
					}
				}
				for ( var i in substates ) {
					substates[i].destroy();
				}
				destroyed = true;
				
			}
		});
		
		// Create an event collection for each supported event type
		$.each( [ 'enter', 'exit', 'arrive', 'depart' ], function ( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		
		// If no superstate, then assume this is a default state being created by a StateController,
		// which will call build() itself after overriding controller()
		superstate && this.build();
	}, {
		prototype: {
			toString: function () {
				return this.derivation( true ).join('.');
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
			isProtostateOf: function ( state ) { //// untested
				var protostate = state.protostate();
				return protostate ? ( this === protostate || this.isProtostateOf( protostate ) ) : false;
			},
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			select: function () {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
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
			
			// Match a string expression `expr` with the state or states it represents.
			// Returns the matched state, the set of matched states, or a boolean indicating whether `testState` is included in the matched set.
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					cursor = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					cursorSubstate,
					result;
				
				if ( parts.length ) {
					$.each( parts, function ( i, name ) {
						if ( name === '' ) {
							cursor = cursor.superstate();
						// } else if ( cursor[ name ] instanceof State ) {
						} else if ( cursorSubstate = cursor.substate( name ) ) {
							cursor = cursorSubstate;
						} else if ( name == '*' ) {
							result = testState ? cursor === testState.superstate() : cursor.substateCollection();
							return false;
						} else if ( name == '**' ) {
							result = testState ? cursor.isSuperstateOf( testState ) : cursor.substateCollection( true );
							return false;
						} else {
							return result = false;
						}
					});
					return (
						result !== undefined ? result :
						!testState || cursor === testState ? cursor :
						false
					);
				} else {
					return cursor;
				}
			}
		}
	}
);
