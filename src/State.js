/**
 * # State
 */

/**
 * Constructor for `State` typed objects, as well as the root namespace.
 */
var State = extend( true,
	/**
	 * 
	 */
	function State ( superstate, name, definition ) {
		/**
		 * If not invoked as a constructor, `State()` acts as an alias for acquiring either a `StateDefinition`
		 * object based on a single object map, or if also supplied with at least an `owner` object reference,
		 * a `StateController` object that is bound to the owner.
		 * 
		 * @see StateDefinition
		 * @see StateController
		 */
		if ( !( this instanceof State ) ) {
			return ( arguments.length < 2 ? State.Definition : State.Controller ).apply( this, arguments );
		}
		
		var	self = this,
			privileged = State.privileged,
			destroyed = false,
			data, history = [],
			methods = {},
			events = nullHash( State.Event.types ),
			rules = {},
			substates = {},
			transitions = {},
			getName;
		
		/**
		 * Defines a setter function; this can be passed to external privileged methods to provide access to
		 * free variables within the constructor.
		 */
		function setDefinition ( value ) { return definition = value; }
		
		// deprivatize these for now to allow visibility to inspectors
		extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates,
			transitions: transitions
		});

		/**
		 * Internal privileged methods.
		 */
		extend( this, {
			/**
			 * Get the state's name. Copying the function to its own `toString` exposes the value of `name`
			 * when the method is viewed in the Chrome web inspector.
			 */
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			/**
			 * Get the `StateDefinition` that was used to define this state.
			 */
			definition: function () { return definition; },
			
			/**
			 * Curried indirection to `State.privileged.init`.
			 * @see State.privileged.init
			 */
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
			
			/**
			 * ( [Boolean viaSuper], [Boolean viaProto] )
			 * Gets the `data` attached to this state, including all data from inherited states, unless
			 * specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
			 * 
			 * ( Object edit, [Boolean isDeletion] )
			 * Sets the `data` on this state, overwriting any existing items, or if `!!isDeletion` is `true`,
			 * deletes from `data` the items with matching keys in `edit` whose values evaluate to `true`. If
			 * the operation causes `data` to be changed, a `mutate` event is generated for this state.
			 */
			data: function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				var viaSuper, viaProto, key, protostate;
				
				// If first argument is a Boolean, interpret method call as a "get" with inheritance flags.
				edit === !!edit && ( viaSuper = edit, viaProto = isDeletion, edit = false );
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				if ( edit ) { // set
					( isDeletion ?
						data && !isEmpty( data ) && !isEmpty( edit ) && subtract( true, data, edit )
						:
						isEmpty( edit ) || extend( true, data || ( data = {} ), edit )
					) &&
						this.triggerEvents( 'mutate', { edit: edit, isDeletion: isDeletion } );
					return this;
				} else { // get
					return data ?
						extend( true, {},
							viaSuper && superstate && superstate.data(),
							viaProto && ( protostate = this.protostate() ) && protostate.data( false ),
							data )
						:
						undefined;
				}
			},
			
			/**
			 * Curried indirection to `State.privileged.method`.
			 * @see State.privileged.method
			 */
			method: function () {
				return privileged.method( methods ).apply( this, arguments );
			},
			
			/**
			 * Curried indirection to `State.privileged.methodAndContext`.
			 * @see State.privileged.methodAndContext
			 */
			methodAndContext: function () {
				return privileged.methodAndContext( methods ).apply( this, arguments );
			},
			
			/**
			 * Returns an `Array` of names of methods defined for this state.
			 */
			methodNames: function () {
				return keys( methods );
			},
			
			/**
			 * Curried indirection to `State.privileged.addMethod`.
			 * @see State.privileged.addMethod
			 */
			addMethod: function () {
				return privileged.addMethod( methods ).apply( this, arguments );
			},
			
			/**
			 * Dissociates the named method from this state object and returns its function.
			 */
			removeMethod: function ( /*String*/ methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			
			/**
			 * Binds an event handler to the specified `eventType` and returns a unique identifier for the
			 * handler. Recognized event types are listed at `State.Event.types`.
			 * @see State.Event
			 */
			addEvent: function ( /*String*/ eventType, /*Function*/ fn ) {
				if ( eventType in events ) {
					events[ eventType ] ||
						( events[ eventType ] = new State.Event.Collection( this, eventType ) );
					return events[ eventType ].add( fn );
				} else {
					throw new Error( "Invalid event type" );
				}
			},
			
			/**
			 * Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
			 * @see State.addEvent
			 */
			removeEvent: function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].remove( id );
			},
			
			/**
			 * Gets a registered event handler.
			 */
			getEvent: function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].get( id );
			},
			
			/**
			 * Gets an `Array` of all event handlers registered for the specified `eventType`.
			 */
			getEvents: function ( /*String*/ eventType ) {
				return events[ eventType ];
			},
			
			/**
			 * Used internally to invoke an event type's handlers at the appropriate time.
			 */
			triggerEvents: function ( /*String*/ eventType, /*Object*/ data ) {
				var e;
				if ( eventType in events ) {
					return ( e = events[ eventType ] ) && e.trigger( data );
				} else {
					throw new Error( "Invalid event type" );
				}
			},
			
			/**
			 * Gets a rule object for this state. Rules are inherited from protostates, but not from
			 * superstates.
			 */
			rule: function ( /*String*/ ruleType ) {
				var protostate;
				return (
					rules[ ruleType ]
						||
					( protostate = this.protostate() ) && protostate.rule( ruleType )
					 	||
					undefined
				);
			},
			
			/**
			 * Adds a rule to the state.
			 */
			addRule: function ( /*String*/ ruleType, rule ) {
				rules[ ruleType ] = rule;
			},
			
			removeRule: function ( /*String*/ ruleType, /*String*/ ruleKey ) {
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
			removeSubstate: function ( /*String*/ stateName ) {
				var	substate = substates[ stateName ],
					controller,
					current,
					transition;
				
				if ( substate ) {
					controller = this.controller();
					current = controller.current();
					
					// Fail if a transition is underway involving `substate`
					if (
						( transition = controller.transition() )
							&&
						(
							substate.isSuperstateOf( transition ) ||
							substate === transition.origin() ||
							substate === transition.destination()
						)
					) {
						return false;
					}
					
					// Evacuate before removing
					controller.isIn( substate ) && controller.change( this, { forced: true } );
					
					delete substates[ stateName ];
					delete this[ stateName ];
					controller.defaultState() === this && delete controller[ stateName ];
					
					return substate;
				}
			},
			
			/**
			 * 
			 */
			substate: function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
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
			substateCollection: function ( /*Boolean*/ deep ) {
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
			 * Attempts to cleanly destroy this state and all of its substates. A 'destroy' event is issued
			 * to each state after it is destroyed.
			 */
			destroy: function () {
				var	controller = this.controller(),
					owner = controller.owner(),
					transition = controller.transition(),
					origin, destination, methodName, method, stateName;
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
				if ( superstate ) {
					superstate.removeSubstate( name );
				} else {
					for ( methodName in methods ) {
						// The default state is being destroyed, so the delegates on the owner can be deleted.
						delete owner[ methodName ];
						
						// A default state may have been holding methods for the owner, so it must give those back.
						if ( ( method = methods[ methodName ] ).autochthonousToOwner ) {
							delete method.autochthonous;
							delete method.autochthonousToOwner;
							owner[ methodName ] = method;
						}
					}
				}
				for ( stateName in substates ) {
					substates[ stateName ].destroy();
				}
				superstate = undefined;
				destroyed = true;
				this.triggerEvents( 'destroy' );
				return true;
			}
		});
		
		// If no superstate, then assume this is a default state being created by a StateController,
		// which will call init() itself after overriding controller()
		superstate && this.init();
	}, {
		/*
		 * Privileged indirections, curried with "private" free variables from inside the constructor.
		 */
		privileged: {
			/**
			 * Builds out the state's members based on the contents of the supplied definition.
			 */
			init: function ( setDefinition ) {
				return function ( /*StateDefinition|Object*/ override ) {
					var	i,
						self = this,
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
								var i;
								isArray( fn ) || ( fn = [ fn ] );
								for ( i in fn ) {
									self.addEvent( eventType, fn[i] );
								}
								// each( isArray( fn ) ? fn : [ fn ], function ( i, fn ) { self.addEvent( eventType, fn ); });
							},
							rules: function ( ruleType, rule ) {
								self.addRule( ruleType, rule );
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
					
					this.triggerEvents( 'construct', { definition: definition } );
					
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
					/*
					 * If there is not already a method called `methodName` in the state hierarchy, then
					 * the owner and controller need to be set up properly to accommodate calls to this
					 * method.
					 */
					if ( !this.method( methodName, true, false ) ) {
						if ( this !== defaultState && !defaultState.method( methodName, false, false ) ) {
							if ( ( ownerMethod = owner[ methodName ] ) !== undefined && !ownerMethod.isDelegate ) {
								/*
								 * If the owner has a method called `methodName` that hasn't already been
								 * substituted with a delegate, then that method needs to be copied into to the
								 * default state, so that calls made from other states which do not implement
								 * this method can be forwarded to this original implementation of the owner.
								 * Before the method is copied, it is marked both as `autochthonous` to
								 * indicate that subsequent calls to the method should be executed in the
								 * context of the owner (as opposed to the usual context of the state for which
								 * the method was declared), and, if the method was not inherited from a
								 * prototype of the owner, as `autochthonousToOwner` to indicate that it must
								 * be returned to the owner should the controller ever be destroyed.
								 */
								ownerMethod.autochthonous = true;
								ownerMethod.autochthonousToOwner = owner.hasOwnProperty( methodName );
							} else {
								/*
								 * Otherwise, since the method being added has no counterpart on the owner, a
								 * no-op is placed on the default state instead.
								 */
								ownerMethod = function () {};
							}
							defaultState.addMethod( methodName, ownerMethod );
						}
						/*
						 * A delegate function is instated on the owner, which will direct subsequent calls to
						 * `owner[ methodName ]` to the controller, and then on to the appropriate state's
						 * implementation.
						 */
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
			
			/**
			 * Gets the `StateController` to which this state belongs.
			 */
			controller: function () {
				return this.superstate().controller();
			},
			
			/**
			 * Gets the owner object to which this state's controller belongs.
			 */
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
			isIn: function ( state ) {
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
			 * If the method was not declared in a state, e.g. one already defined on the owner that was
			 * subsequently "swizzled" onto the default state, the function will have been marked
			 * `autochthonous`, in which case the method will be called in the original context of the owner.
			 */
			apply: function ( methodName, args ) {
				var	mc = this.methodAndContext( methodName ),
					method = mc.method,
					context = mc.context;
				if ( method ) {
					method.autochthonous && ( context = this.owner() );
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
			
			/**
			 * Tells the controller to change to this or the specified `state` and returns the targeted
			 * state.
			 * 
			 * Note that this method is **presumptuous**, in that it immediately returns a state, even
			 * though the transition initiated on the controller may be asynchronous and as yet
			 * incomplete.
			 */
			select: function ( /*State|String*/ state ) {
				state === undefined && ( state = this ) || state instanceof State || ( state = this.match( state ) );
				return this.controller().change( state ) && state;
			},
			
			/**
			 * Returns a `Boolean` indicating whether `this` is the controller's current state.
			 */
			isSelected: function () {
				return this.controller().current() === this;
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
						} else if ( name === '*' ) {
							result = testState ? cursor === testState.superstate() : cursor.substateCollection();
							return false;
						} else if ( name === '**' ) {
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
		 * the controller's current state.
		 * 
		 * The context of autochthonous methods relocated to the default state remains bound to the owner.
		 * Otherwise, methods are executed in the context of the state in which they are declared, or if the
		 * implementation resides in a protostate, the context will be the corresponding `StateProxy` within
		 * `controller`.
		 * 
		 * @see State.addMethod
		 */
		delegate: function ( methodName, controller ) {
			function delegate () { return controller.current().apply( methodName, arguments ); }
			delegate.isDelegate = true;
			return delegate;
		},
		
		/**
		 * Reinstates the original occupant of `'State'` on the global object and returns this module's
		 * `State`.
		 */
		noConflict: function () {
			global.State = autochthon;
			return this;
		}
	}
);
