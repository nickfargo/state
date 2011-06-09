var State = extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			return ( arguments.length < 2 ? State.Definition : State.Controller ).apply( this, arguments );
		}
		
		var	self = this,
			privileged = State.privileged,
			destroyed = false,
			data, history = [],
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
			substates: substates,
			transitions: transitions
		});

		extend( this, {
			// directly expose the value while keeping it readonly (a convenience for viewing in Chrome inspector)
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			definition: function () { return definition; },
			
			init: function () {
				return privileged.init( setDefinition ).apply( this, arguments );
			},
			
			/**
			 * Returns the immediate superstate, or the nearest state in the superstate chain with the
			 * provided `stateName`.
			 */
			superstate: function ( /*String*/ stateName ) {
				return stateName === undefined ?
					superstate
					:
					superstate ?
						stateName ?
							superstate.name() === stateName ?
								superstate : superstate.superstate( stateName )
							:
							this.controller().defaultState()
						:
						undefined;
			},
			
			data: function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				return edit ?
					// set
					isDeletion ?
						( subtract( true, data, deletions ), data ) //// untested
						:
						( data = extend( true, data || {}, edit ) )
				 	:
					// get
					data ?
						extend( true, {}, superstate && superstate.data(), data )
						:
						undefined;
			},
			
			method: function () {
				return privileged.method( methods ).apply( this, arguments );
			},
			
			methodAndContext: function () {
				return privileged.methodAndContext( methods ).apply( this, arguments );
			},
			
			addMethod: function () {
				return privileged.addMethod( methods ).apply( this, arguments );
			},
			
			removeMethod: function ( /*String*/ methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			
			addEvent: function ( /*String*/ eventType, /*Function*/ fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.add( fn );
			},
			
			removeEvent: function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].remove( id );
			},
			
			getEvent: function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].get( id );
			},
			
			getEvents: function ( /*String*/ eventType ) {
				return events[ eventType ];
			},
			
			triggerEvents: function ( /*String*/ eventType, /*Object*/ data ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.trigger( data );
			},
			
			rule: function ( /*String*/ ruleName ) {
				var protostate;
				return (
					definition && definition.rules && definition.rules[ ruleName ]
						||
					( protostate = this.protostate() ) && protostate.rule( ruleName )
					 	||
					undefined
				);
			},
			
			addRule: function ( /*String*/ ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			
			removeRule: function ( /*String*/ ruleName, /*String*/ ruleKey ) {
				throw new Error( "Not implemented" );
			},
			
			/**
			 * Creates a state from the supplied `stateDefinition` and adds it as a substate of this state.
			 * If a substate with the same `stateName` already exists, it is first destroyed and then replaced.
			 * If the new substate is being added to the controller's default state, a reference is added
			 * directly on the controller itself as well.
			 */
			addSubstate: function ( /*String*/ stateName, /*StateDefinition | Object*/ stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller.defaultState() === this && ( controller[ stateName ] = substate );
				return substate;
			},
			
			/**
			 * 
			 */
			removeSubstate: function ( /*String*/ stateName ) { //// untested
				// throw new Error( "Not implemented" );
				
				var	substate = substates[ stateName ],
					controller,
					current,
					transition;
				if ( substate ) {
					controller = this.controller();
					current = controller.currentState();
					// evacuate before removing
					// TODO: fail if a transition is underway involving `substate`
					// ( transition = controller.transition() ) && (
					// 	substate.isSuperstateOf( transition ) ||
					// 	substate === transition.origin()
					// );
					controller.isInState( substate ) && controller.changeState( this, { forced: true } );
					delete substates[ stateName ];
					delete this[ stateName ];
					controller.defaultState() === this && delete controller[ stateName ];
					return substate;
				}
			},
			
			/**
			 * 
			 */
			substate: function ( /*String*/ stateName, /*Boolean*/ viaProto ) { //// untested
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
			substateCollection: function ( /*Boolean*/ deep ) { //// untested
				var result = [], i;
				for ( i in substates ) {
					result.push( substates[i] );
					deep && ( result = result.concat( substates[i].substateCollection( true ) ) );
				}
				return result;
			},
			
			addTransition: function ( /*String*/ transitionName, /*StateTransitionDefinition | Object*/ transitionDefinition ) {
				transitionDefinition instanceof State.Transition.Definition ||
					( transitionDefinition = State.Transition.Definition( transitionDefinition ) );
				transitions[ transitionName ] = transitionDefinition;
				return transitionDefinition;
			},
			
			transition: function ( transitionName ) {
				return transitions[ transitionName ];
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
		// which will call init() itself after overriding controller()
		superstate && this.init();
	}, {
		/*
		 * Curried indirections, called from inside the constructor. Allows access to "private" free vars of
		 * the constructor.
		 */
		privileged: {
			/**
			 * Builds out the state's members based on the contents of the supplied definition.
			 */
			init: function ( setDefinition ) {
				return function ( /*StateDefinition|Object*/ override ) {
					var	self = this,
						definition = this.definition();
					
					// Validate and expand out the definition if necessary
					override && ( definition = override );
					definition instanceof State.Definition || ( definition = State.Definition( definition ) );
					setDefinition( definition );
					
					// Build
					// TODO: (???) destroy()
					definition.data && this.data( definition.data );
					each({
							methods: function ( methodName, fn ) {
								self.addMethod( methodName, fn );
							},
							events: function ( eventType, fn ) {
								each( isArray( fn ) ? fn : [ fn ], function ( i, fn ) { self.addEvent( eventType, fn ); });
							},
							rules: function ( ruleName, rule ) {
								self.addRule( ruleName, rule );
							},
							states: function ( stateName, stateDefinition ) {
								self.addSubstate( stateName, stateDefinition );
							},
							transitions: function ( transitionName, transitionDefinition ) {
								self.addTransition( transitionName, transitionDefinition );
							}
						},
						function ( i, fn ) {
							definition[i] && each( definition[i], fn );
						}
					);
					
					return this;
				};
			},
			
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
			method: function ( methods ) {
				return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
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
				};
			},
			
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			methodAndContext: function ( methods ) {
				return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
					var	superstate, protostate, result = {};
				
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
						result
					);
				};
			},
			
			/**
			 * Adds a method to this state, callable directly from the owner.
			 */
			addMethod: function ( methods ) {
				return function ( methodName, fn ) {
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
				};
			}
		},
		prototype: {
			/**
			 * Returns this state's fully qualified name.
			 */
			toString: function () {
				return this.derivation( true ).join('.');
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
			 * @param byName Returns a string array of the states' names, rather than references
			 */
			derivation: function ( /*Boolean*/ byName ) {
				for (
					var result = [], s, ss = this;
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
			common: function ( /*State*/ other ) {
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
			 * Finds a state method and applies it in the context of the state in which it was declared, or
			 * if the implementation resides in a protostate, the corresponding `StateProxy`.
			 * 
			 * If the method was not declared in a state, e.g. one that that had already been defined and
			 * was subsequently "swizzled" onto the default state, the function will have been marked
			 * `callAsOwner`, in which case the method will be called in the original context of the owner.
			 */
			apply: function ( methodName, args ) {
				var	mc = this.methodAndContext( methodName ),
					method = mc.method,
					context = mc.context;
				if ( method ) {
					method.callAsOwner && ( context = this.owner() );
					return method.apply( context, args );
				}
			},
			
			/**
			 * @see apply
			 */
			call: function ( methodName ) {
				return this.apply( methodName, slice( arguments, 1 ) );
			},
			
			/**
			 * Determines whether `this` directly possesses a method named `methodName`.
			 */
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			
			select: function () {
				return this.controller().changeState( this ) && this;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
			},
			change: function ( /*State|String*/ state ) {
				return this.controller().changeState( state ) && this;
			},
			
			/**
			 * Returns the Boolean result of the rule function at `ruleName` defined on this state, as
			 * evaluated against `testState`, or `true` if no rule exists.
			 */
			evaluateRule: function ( /*String*/ ruleName, /*State*/ testState ) {
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
			match: function ( /*String*/ expr, /*State*/ testState ) {
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
		 * a method of the controller's owner, then it will be executed in its original context. Otherwise,
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
			function delegate () { return controller.currentState().apply( methodName, arguments ); }
			delegate.isDelegate = true;
			return delegate;
		},
		
		change: function ( /*String*/ expr ) {
			return function () { return this.change( expr ); }
		}
	}
);
