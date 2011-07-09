/**
 * # State
 */

/**
 * Constructor for `State` typed objects, as well as the root namespace.
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
	
	var	getName,
		self = this,
		destroyed = false,
		// history = [],
		data = {},
		methods = {},
		events = nullHash( State.Event.types ),
		rules = {},
		substates = {},
		transitions = {};
	
	/*
	 * Setter functions; these are passed as arguments to external privileged methods to provide access to
	 * free variables within the constructor.
	 */
	function setSuperstate ( value ) { return superstate = value; }
	function setDefinition ( value ) { return definition = value; }
	function setDestroyed ( value ) { return destroyed = !!value; }
	
	// expose these in debug mode
	debug && extend( this.__private__ = {}, {
		data: data,
		methods: methods,
		events: events,
		rules: rules,
		substates: substates,
		transitions: transitions
	});
	
	/**
	 * Get the state's name. Copying the function to its own `toString` exposes the value of `name`
	 * when the method is viewed in the Chrome web inspector.
	 */
	( this.name = function () { return name || ''; } ).toString = this.name;
	
	/** Get the `StateDefinition` that was used to define this state. */
	this.definition = function () { return definition; };
	
	/*
	 * External privileged methods
	 * 
	 * Method names are mapped to specific internal free variables. The named methods are created on
	 * `this`, each of which is partially applied with its mapped free variables to the correspondingly
	 * named methods at `State.privileged`.
	 */
	indirect( this, State.privileged, {
		'init' : [ State.Definition, setDefinition ],
		'superstate' : [ superstate ],
		'data' : [ data ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events addEvent removeEvent trigger' : [ events ],
		'rule addRule removeRule' : [ rules ],
		'substate substates addSubstate removeSubstate' : [ substates ],
		'transition transitions addTransition' : [ transitions ],
		'destroy' : [ setSuperstate, setDestroyed, methods, substates ]
	});
	
	/*
	 * If no superstate, e.g. a default state being created by a StateController, then `init()` must be
	 * called later by the implementor.
	 */
	superstate && this.init();
}

extend( true, State, {
	/*
	 * Privileged indirections, partially applied with private free variables from inside the constructor.
	 */
	privileged: {
		/**
		 * Builds out the state's members based on the contents of the supplied definition.
		 */
		init: function ( /*Function*/ DefinitionConstructor, /*Function*/ setDefinition ) {
			return function ( /*<DefinitionConstructor>|Object*/ definitionOverride ) {
				var	category,
					definition = definitionOverride || this.definition(),
					self = this;
			
				definition instanceof DefinitionConstructor ||
					setDefinition( definition = DefinitionConstructor( definition ) );
			
				definition.data && this.data( definition.data );
				each({
					methods: function ( methodName, fn ) {
						self.addMethod( methodName, fn );
					},
					events: function ( eventType, fn ) {
						var i, l;
						isArray( fn ) || ( fn = [ fn ] );
						for ( i = 0, l = fn.length; i < l; i++ ) {
							self.addEvent( eventType, fn[i] );
						}
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
				}, function ( category, fn ) {
					definition[category] && each( definition[category], fn );
				});
			
				this.trigger( 'construct', { definition: definition } );
			
				return this;
			};
		},
	
		superstate: function ( /*State*/ superstate ) {
			/**
			 * Returns the immediate superstate, or the nearest state in the superstate chain with the
			 * provided `stateName`.
			 */
			return function ( /*String*/ stateName ) {
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
			}
		},
	
		data: function ( /*Object*/ data ) {
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
			return function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				var viaSuper, viaProto, key, superstate, protostate;
		
				// If first argument is a Boolean, interpret method call as a "get" with inheritance flags.
				typeof edit === 'boolean' && ( viaSuper = edit, viaProto = isDeletion, edit = false );
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
		
				if ( edit ) { // set
					( isDeletion ?
						!isEmpty( data ) && !isEmpty( edit ) && excise( true, data, edit )
						:
						isEmpty( edit ) || extend( true, data, edit )
					) &&
						this.trigger( 'mutate', { edit: edit, isDeletion: isDeletion } );
					return this;
				} else { // get
					return isEmpty( data ) ?
						undefined
						:
						extend( true, {},
							viaSuper && ( superstate = this.superstate() ) && superstate.data(),
							viaProto && ( protostate = this.protostate() ) && protostate.data( false ),
							data );
				}
			}
		},
	
		method: function ( methods ) {
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
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
			};
		},
	
		methodAndContext: function ( methods ) {
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
				var	superstate, protostate,
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
					result
				);
			};
		},
	
		methodNames: function ( methods ) {
			/** Returns an `Array` of names of methods defined for this state. */
			return function () {
				return keys( methods );
			};
		},
	
		addMethod: function ( methods ) {
			/**
			 * Adds a method to this state, which will be callable directly from the owner, but with its
			 * context bound to the state.
			 */
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
							ownerMethod.autochthonousToOwner = hasOwn.call( owner, methodName );
						} else {
							/*
							 * Otherwise, since the method being added has no counterpart on the owner, a
							 * no-op is placed on the default state instead. Consequently the added method
							 * may be called no matter which state the controller is in, though it 
							 */
							ownerMethod = noop;
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
		},
	
		removeMethod: function ( methods ) {
			/** Dissociates the named method from this state object and returns its function. */
			return function ( /*String*/ methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			};
		},
	
		event: function ( events ) {
			/** Gets a registered event handler. */
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].get( id );
			};
		},
	
		events: function ( events ) {
			/** Gets an `Array` of all event handlers registered for the specified `eventType`. */
			return function ( /*String*/ eventType ) {
				return events[ eventType ];
			};
		},
	
		addEvent: function ( events ) {
			/**
			 * Binds an event handler to the specified `eventType` and returns a unique identifier for the
			 * handler. Recognized event types are listed at `State.Event.types`.
			 * @see State.Event
			 */
			return function ( /*String*/ eventType, /*Function*/ fn ) {
				if ( eventType in events ) {
					events[ eventType ] ||
						( events[ eventType ] = new State.Event.Collection( this, eventType ) );
					return events[ eventType ].add( fn );
				} else {
					throw new Error( "Invalid event type" );
				}
			};
		},
	
		removeEvent: function ( events ) {
			/**
			 * Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
			 * @see State.addEvent
			 */
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].remove( id );
			};
		},
	
		trigger: function ( events ) {
			/** Used internally to invoke an event type's handlers at the appropriate time. */
			return function ( /*String*/ eventType, /*Object*/ data ) {
				var e;
				return eventType in events && ( e = events[ eventType ] ) && e.trigger( data ) && this;
			};
		},

		rule: function ( rules ) {
			/**
			 * Gets a rule object for this state. Rules are inherited from protostates, but not from
			 * superstates.
			 */
			return function ( /*String*/ ruleType ) {
				var protostate;
				return (
					rules[ ruleType ]
						||
					( protostate = this.protostate() ) && protostate.rule( ruleType )
					 	||
					undefined
				);
			};
		},
	
		addRule: function ( rules ) {
			/** Adds a rule to the state. */
			return function ( /*String*/ ruleType, rule ) {
				rules[ ruleType ] = rule;
			};
		},
	
		removeRule: function ( rules ) {
			/** */
			return function ( /*String*/ ruleType, /*String*/ ruleKey ) {
				throw new Error( "Not implemented" );
			};
		},
	
		substate: function ( substates ) {
			/** */
			return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
				var protostate;
				viaProto === undefined && ( viaProto = true );
				return (
					substates[ stateName ] ||
					viaProto && ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined )
				);
			};
		},
	
		// TODO: rewrite to consider protostates
		substates: function ( substates ) {
			/** Returns an `Array` of this state's substates. */
			return function ( /*Boolean*/ deep ) {
				var key,
					result = [];
				for ( key in substates ) if ( hasOwn.call( substates, key ) ) {
					result.push( substates[key] );
					deep && ( result = result.concat( substates[key].substates( true ) ) );
				}
				return result;
			};
		},
	
		addSubstate: function ( substates ) {
			/**
			 * Creates a state from the supplied `stateDefinition` and adds it as a substate of this state.
			 * If a substate with the same `stateName` already exists, it is first destroyed and then replaced.
			 * If the new substate is being added to the controller's default state, a reference is added
			 * directly on the controller itself as well.
			 */
			return function ( /*String*/ stateName, /*StateDefinition | Object*/ stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller.defaultState() === this && ( controller[ stateName ] = substate );
				return substate;
			};
		},
	
		removeSubstate: function ( substates ) {
			/** */
			return function ( /*String*/ stateName ) {
				var	controller, current, transition,
					substate = substates[ stateName ];
		
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
			};
		},
	
		transition: function ( transitions ) {
			/** */
			return function ( transitionName ) {
				return transitions[ transitionName ];
			};
		},
	
		transitions: function ( transitions ) {
			/** */
			return function () {
				return extend( true, {}, transitions );
				// var i, result = [];
				// for ( i in transitions ) if ( hasOwn.call( transitions, i ) ) {
				// 	result.push( transitions[i] );
				// }
				// return result;
			};
		},
	
		addTransition: function ( transitions ) {
			/** */
			return function ( /*String*/ transitionName, /*StateTransitionDefinition | Object*/ transitionDefinition ) {
				transitionDefinition instanceof State.Transition.Definition ||
					( transitionDefinition = State.Transition.Definition( transitionDefinition ) );
				return transitions[ transitionName ] = transitionDefinition;
			};
		},
	
		destroy: function ( setSuperstate, setDestroyed, methods, substates ) {
			/**
			 * Attempts to cleanly destroy this state and all of its substates. A 'destroy' event is issued
			 * to each state after it is destroyed.
			 */
			return function () {
				var	superstate = this.superstate(),
					controller = this.controller(),
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
						// TODO: instead of failing, defer destroy() until after transition.end()
						return false;
					}
				}
			
				if ( superstate ) {
					superstate.removeSubstate( name );
				} else {
					for ( methodName in methods ) if ( hasOwn.call( methods, methodName ) ) {
						// It's the default state being destroyed, so the delegates on the owner can be deleted.
						hasOwn.call( owner, methodName ) && delete owner[ methodName ];
					
						// A default state may have been holding methods for the owner, which it must give back.
						if ( ( method = methods[ methodName ] ).autochthonousToOwner ) {
							delete method.autochthonous;
							delete method.autochthonousToOwner;
							owner[ methodName ] = method;
						}
					}
				}
				for ( stateName in substates ) if ( hasOwn.call( substates, stateName ) ) {
					substates[ stateName ].destroy();
				}
				setSuperstate( undefined );
				setDestroyed( true );
				this.trigger( 'destroy' );
			
				return true;
			};
		}
	},
	
	prototype: {
		/** Returns this state's fully qualified name. */
		toString: function () {
			return this.derivation( true ).join('.');
		},
		
		/** Gets the `StateController` to which this state belongs. */
		controller: function () {
			return this.superstate().controller();
		},
		
		/** Gets the owner object to which this state's controller belongs. */
		owner: function () {
			return this.controller().owner();
		},
		
		/** Gets the default state, i.e. the top-level superstate of this state. */
		defaultState: function () {
			return this.controller.defaultState();
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
						hasOwn.call( prototype, controllerName ) &&
						prototype[ controllerName ] instanceof State.Controller ?
					prototype[ controllerName ].defaultState() :
					undefined;
			}
			
			for ( iterate(); protostate; iterate() ) {
				for ( state in derivation ) if ( hasOwn.call( derivation, state ) ) {
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
		
		/** Determines whether `this` is or is a substate of `state`. */
		isIn: function ( state ) {
			state instanceof State || ( state = this.match( state ) );
			return ( state === this || state.isSuperstateOf( this ) );
		},
		
		/** Determines whether `this` is a superstate of `state`. */
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
		 * if the implementation resides in a protostate, the corresponding `StateProxy` in the calling
		 * controller.
		 * 
		 * If the method was autochthonous, i.e. it was already defined on the owner and subsequently
		 * "swizzled" onto the default state when the controller was constructed, then its function
		 * will have been marked `autochthonous`, and the method will thereafter be called in the
		 * original context of the owner.
		 */
		apply: function ( methodName, args ) {
			var	mc = this.methodAndContext( methodName ),
				method = mc.method;
			if ( method ) {
				return method.apply( method.autochthonous ? this.owner() : mc.context, args );
			}
		},
		
		/** @see apply */
		call: function ( methodName ) {
			return this.apply( methodName, slice( arguments, 1 ) );
		},
		
		/** Determines whether `this` directly possesses a method named `methodName`. */
		hasMethod: function ( methodName ) {
			var method = this.method( methodName );
			return method && method !== noop;
		},
		
		/** Determines whether `this` directly possesses a method named `methodName`. */
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
		
		/** Returns a `Boolean` indicating whether `this` is the controller's current state. */
		isSelected: function () {
			return this.controller().current() === this;
		},
		
		/** */
		pushHistory: global.history && global.history.pushState ?
			function ( title, urlBase ) {
				return global.history.pushState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
			} : noop
		,
		
		/** */
		replaceHistory: global.history && global.history.replaceState ?
			function ( title, urlBase ) {
				return global.history.replaceState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
			} : noop
		,
		
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
						result = testState ? cursor === testState.superstate() : cursor.substates();
						return false;
					} else if ( name === '**' ) {
						result = testState ? cursor.isSuperstateOf( testState ) : cursor.substates( true );
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
});
