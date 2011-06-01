var State = extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		var	self = this,
			prototype = State.prototype,
			destroyed = false,
			methods = {},
			events = {},
			rules = {},
			substates = {},
			transitions = {},
			getName;
		
		function setDefinition ( value ) { return definition = value; }
		
		// deprivatize these for now to allow visibility to inspectors
		extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		extend( this, {
			superstate: function () { return superstate; },
			// directly expose the value while keeping it readonly (a convenience for viewing in Chrome inspector)
			name: ( getName = function () { return name || ''; } ).toString = getName,
			definition: function () { return definition; },
			
			build: function () {
				return prototype.build.apply( this, concat( setDefinition, slice( arguments ) ) );
				// return prototype.build.apply( this, [ setDefinition ].concat( slice( arguments ) ) );
			},
			
			method: function () {
				return prototype.method.apply( this, concat( methods, slice( arguments ) ) );
			},
			
			methodAndContext: function () {
				return prototype.methodAndContext.apply( this, concat( methods, slice( arguments ) ) );
			},
			
			addMethod: function () {
				return prototype.addMethod.apply( this, concat( methods, slice( arguments ) ) );
			},
			
			removeMethod: function ( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			
			addEvent: function ( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.add( fn );
			},
			
			removeEvent: function ( eventType, id ) {
				return events[ eventType ].remove( id );
			},
			
			getEvent: function ( eventType, id ) {
				return events[ eventType ].get( id );
			},
			
			getEvents: function ( eventType ) {
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
				var protostate;
				return (
					definition && definition.rules && definition.rules[ ruleName ]
						||
					( protostate = this.protostate() ) && protostate.rule( ruleName )
					 	||
					undefined
				);
			},
			
			addRule: function ( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			
			removeRule: function ( ruleName, ruleKey ) {
				throw new Error( "Not implemented" );
			},
			
			/**
			 * Creates and adds a substate.
			 */
			addState: function ( stateName, stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller && controller.defaultState() === this && ( controller[ stateName ] = substate );
				return substate;
			},
			
			/**
			 * 
			 */
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
			
			/**
			 * 
			 */
			substate: function ( stateName, viaProto ) { //// untested
				var protostate;
				viaProto === undefined && ( viaProto = true );
				return (
					substates[ stateName ] ||
					viaProto && ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined )
				);
			},
			
			/**
			 * Returns an `Array` of this state's substates.
			 */
			// TODO: rewrite to consider protostates
			substateCollection: function ( deep ) { //// untested
				var result = [], i;
				for ( i in substates ) {
					result.push( substates[i] );
					deep && ( result = result.concat( substates[i].substateCollection( true ) ) );
				}
				return result;
			},
			
			addTransition: function () {
				
			},
			
			transitions: function () {
				return transitions;
			},
			
			/**
			 * 
			 */
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
		each( State.Event.types, function ( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( self, eventType );
		});
		
		// If no superstate, then assume this is a default state being created by a StateController,
		// which will call build() itself after overriding controller()
		superstate && this.build();
	}, {
		prototype: {
			/**
			 * Returns this state's fully qualified name.
			 */
			toString: function () {
				return this.derivation( true ).join('.');
			},
			
			build: function ( setDefinition, definitionOverride ) {
				var self = this;
				definitionOverride && setDefinition( definitionOverride );
				this.definition() instanceof State.Definition || setDefinition( State.Definition( this.definition() ) );
				// TODO: (???) destroy()
				each(
					{
						methods: function ( methodName, fn ) {
							self.addMethod( methodName, fn );
						},
						events: function ( eventType, fn ) {
							if ( isArray( fn ) ) {
								each( fn, function ( i, fn ) {
									self.addEvent( eventType, fn );
								});
							} else {
								self.addEvent( eventType, fn );
							}
						},
						rules: function ( ruleName, rule ) {
							self.addRule( ruleName, rule );
						},
						states: function ( stateName, stateDefinition ) {
							self.addState( stateName, stateDefinition );
						}
					},
					function ( i, fn ) {
						self.definition()[i] && each( self.definition()[i], fn );
					}
				);
				return this;
			},
			
			controller: function () {
				return this.superstate().controller();
			},
			
			owner: function () {
				return this.controller().owner();
			},
			
			/**
			 * Returns the **protostate**, the state analogous to `this` found in the next object in the
			 * owner's prototype chain that has one. A state inherits from both its protostate and
			 * superstate, *in that order*.
			 * 
			 * If the owner does not share an analogous `StateController` with its prototype, or if no
			 * protostate can be found in the hierarchy of the prototype's state controller, then the
			 * search is iterated up the prototype chain.
			 * 
			 * Notes:
			 * (1) A state and its protostate will always share an identical name and identical
			 * derivation pattern.
			 * (2) The respective superstates of both a state and its protostate will also adhere to
			 * point (1).
			 */
			protostate: function () { //// TODO: needs more unit tests
				var	derivation = this.derivation( true ),
					controller = this.controller(),
					controllerName = controller.name(),
					owner = controller.owner(),
					prototype = owner,
					state, protostate;
				
				function iterate () {
					prototype = prototype.__proto__ || prototype.constructor.prototype;
					protostate = prototype &&
							prototype.hasOwnProperty( controllerName ) &&
							prototype[ controllerName ] instanceof State.Controller ?
						prototype[ controllerName ].defaultState() :
						undefined;
				}
				
				for ( iterate(); protostate; iterate() ) {
					for ( state in derivation ) {
						if ( !( protostate = protostate[ derivation[ state ] ] ) ) {
							break;
						}
					}
					if ( protostate ) {
						return protostate;
					}
				}
			},
			
			/**
			 * Returns an object array of this state's superstate chain, starting after the default state
			 * and ending at `this`.
			 * 
			 * @param byName:Boolean  Returns a string array of the states' names, rather than references
			 */
			derivation: function ( byName ) {
				for ( var result = [], s, ss = this;
						( s = ss ) && ( ss = s.superstate() );
						result.unshift( byName ? s.name() || '' : s )
					);
				return result;
			},
			
			/**
			 * Returns the number of superstates this state has. The root default state returns `0`, its
			 * immediate substates return `1`, etc.
			 */
			depth: function () {
				for ( var count = 0, state = this; state.superstate(); count++, state = state.superstate() );
				return count;
			},
			
			/**
			 * Returns the state that is the nearest superstate, or the state itself, of both `this` and `other`.
			 * Used to establish a common domain between any two states in a hierarchy.
			 */
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
			
			/**
			 * Determines whether `this` is or is a substate of `state`.
			 */
			isIn: function ( state ) { //// untested
				state instanceof State || ( state = this.match( state ) );
				return ( state === this || state.isSuperstateOf( this ) );
			},
			
			/**
			 * Determines whether `this` is a superstate of `state`.
			 */
			isSuperstateOf: function ( state ) {
				var superstate;
				state instanceof State || ( state = this.match( state ) );
				return ( superstate = state.superstate() ) ? ( this === superstate || this.isSuperstateOf( superstate ) ) : false;
			},
			
			/**
			 * Determines whether `this` is a state analogous to `state` on any object in the prototype
			 * chain of `state`'s owner.
			 */
			isProtostateOf: function ( state ) { //// untested
				var protostate;
				state instanceof State || ( state = this.match( state ) );
				return ( protostate = state.protostate() ) ? ( this === protostate || this.isProtostateOf( protostate ) ) : false;
			},
			
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
			method: function ( methods, methodName, viaSuper, viaProto ) {
				var	superstate, protostate;
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					methods[ methodName ]
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && ( superstate = this.superstate() ) && superstate.method( methodName, true, viaProto )
						||
					undefined
				);
				
				return this.methodAndContext( methodName, viaSuper, viaProto ).method;
			},
			
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			methodAndContext: function ( methods, methodName, viaSuper, viaProto ) {
				var	superstate,
					protostate,
					result = {};
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					( result.method = methods[ methodName ] ) && ( result.context = this, result )
						||
					viaProto && ( protostate = this.protostate() ) &&
							( result = protostate.methodAndContext( methodName, false, true ) ) && ( result.context = this, result )
						||
					viaSuper && ( superstate = this.superstate() ) && superstate.methodAndContext( methodName, true, viaProto )
						||
					undefined
				);
			},
			
			/**
			 * Determines whether `this` directly possesses a method named `methodName`.
			 */
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			
			/**
			 * Adds a method to this state, callable directly from the owner.
			 */
			addMethod: function ( methods, methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner(),
					ownerMethod;
				if ( !this.method( methodName, true, false ) ) {
					if ( this !== defaultState &&
						!defaultState.method( methodName, false, false ) &&
						( ownerMethod = owner[ methodName ] ) !== undefined &&
						!ownerMethod.isDelegate
					) {
						ownerMethod.callAsOwner = true;
						defaultState.addMethod( methodName, ownerMethod );
					}
					owner[ methodName ] = State.delegate( methodName, controller );
				}
				return ( methods[ methodName ] = fn );
			},
			
			select: function () {
				return this.controller().changeState( this ) && this;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
			},
			change: function ( state ) {
				return this.controller().changeState( state ) && state;
			},
			
			/**
			 * Returns the Boolean result of the rule function at `ruleName` defined on this state, as
			 * evaluated against `testState`, or `true` if no rule exists.
			 */
			evaluateRule: function ( ruleName, testState ) {
				var	state = this,
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					each( rule, function ( selector, value ) {
						each( selector.split(','), function ( i, expr ) {
							if ( state.match( trim( expr ), testState ) ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
				}
				return ( result === undefined ) || result;
			},
			
			/**
			 * Matches a string expression `expr` with the state or states it represents, evaluated in the
			 * context of `this`.
			 * 
			 * Returns the matched state, the set of matched states, or a Boolean indicating whether
			 * `testState` is included in the matched set.
			 */
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					cursor = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					cursorSubstate,
					result;
				
				if ( parts.length ) {
					each( parts, function ( i, name ) {
						if ( name === '' ) {
							cursor = cursor.superstate();
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
		},
		
		/**
		 * Returns a function that forwards a `methodName` call to `controller`, which will itself then
		 * forward the call on to the appropriate implementation in the state hierarchy as determined by
		 * the controller's current state. If the forwarded method is on the default state and was originally
		 * a method of the controller's owner, then it will be executed in its original context; Otherwise,
		 * it will be executed in the context of the state to which the selected method implementation
		 * belongs, or if the implementation resides in a protostate, the context will be the corresponding
		 * `StateProxy` within `controller`.
		 * 
		 * The result of this is that, for a method defined in a state, `this` refers to the state in which
		 * it is defined (or a proxy state pointing to the protostate in which the method is defined), while
		 * methods originally defined on the owner object itself will still have `this` set to the owner.
		 * 
		 * @see State.addMethod
		 */
		delegate: function ( methodName, controller ) {
			function delegate () {
				var	data = controller.currentState().methodAndContext( methodName );
				if ( data ) {
					if ( data.context === controller.defaultState() && data.method.callAsOwner ) {
						data.context = controller.owner();
					}
					return data.method.apply( data.context, arguments );
				}
			}
			delegate.isDelegate = true;
			return delegate;
		},
		
		change: function ( expr ) {
			return function () { return this.change( expr ); }
		}
	}
);
