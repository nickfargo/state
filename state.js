// State.js
// 
// Copyright (C) 2011-2012 Nick Fargo, Z Vector Inc.
// 
// License MIT
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

( function ( undefined ) {

var	global = this,
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z;

function state () {
	return ( arguments.length < 2 ? StateDefinition : StateController )
		.apply( this, arguments );
}

Z.extend( state, {
	VERSION: '0.0.1',

	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	StateProxy: StateProxy,
	StateTransition: StateTransition,
	StateTransitionDefinition: StateTransitionDefinition,

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

/**
 * # Utility functions
 */

/**
 * Transforms an array of `args` into a map of named arguments, based on the position and type of
 * each item within `args`. This is directed by `map`, wherein each item maps a space-delimited
 * type sequence (e.g., "object array string") to an equal number of space-delimited argument names.
 */
function overload ( args, map ) {
	var	i, l,
		types = [],
		names,
		result = {};
	for ( i = 0, l = args.length; i < l; i++ ) {
		if ( args[i] === undefined ) { break; }
		types.push( Z.type( args[i] ) );
	}
	if ( types.length && ( types = types.join(' ') ) in map ) {
		names = map[ types ].split(' ');
		for ( i = 0, l = names.length; i < l; i++ ) {
			result[ names[i] ] = args[i];
		}
	}
	return result;
}












/**
 * # State
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
		return ( arguments.length < 2 ? StateDefinition : StateController ).apply( this, arguments );
	}
	
	var	self = this,
		destroyed = false,
		// history = [],
		data = {},
		methods = {},
		events = Z.nullHash( StateEvent.types ),
		guards = {},
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
	Z.env.debug && Z.extend( this.__private__ = {}, {
		data: data,
		methods: methods,
		events: events,
		guards: guards,
		substates: substates,
		transitions: transitions
	});
	
	this.name = Z.stringFunction( function () { return name || ''; } );
	this.definition = function () { return definition; };
	
	/*
	 * External privileged methods
	 * 
	 * Method names are mapped to specific internal free variables. The named methods are created on
	 * `this`, each of which is partially applied with its mapped free variables to the correspondingly
	 * named methods at `State.privileged`.
	 */
	Z.constructPrivilegedMethods( this, State.privileged, {
		'init' : [ StateDefinition, setDefinition ],
		'superstate' : [ superstate ],
		'data' : [ data ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events on addEvent removeEvent emit trigger' : [ events ],
		'guard addGuard removeGuard' : [ guards ],
		'substate substates addSubstate removeSubstate' : [ substates ],
		'transition transitions addTransition' : [ transitions ],
		'destroy' : [ setSuperstate, setDestroyed, methods, substates ]
	});
	
	/*
	 * If no superstate, e.g. a default state being created by a `StateController`, then `init()` must be
	 * called later by the implementor.
	 */
	superstate && this.init();
}

/*
 * Privileged indirections, partially applied with private free variables from inside the `State` constructor.
 */
State.privileged = new function () {
	Z.extend( this, {
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
				Z.each({
					methods: function ( methodName, fn ) {
						self.addMethod( methodName, fn );
					},
					events: function ( eventType, fn ) {
						var i, l;
						Z.isArray( fn ) || ( fn = [ fn ] );
						for ( i = 0, l = fn.length; i < l; i++ ) {
							self.addEvent( eventType, fn[i] );
						}
					},
					guards: function ( guardType, guard ) {
						self.addGuard( guardType, guard );
					},
					states: function ( stateName, stateDefinition ) {
						self.addSubstate( stateName, stateDefinition );
					},
					transitions: function ( transitionName, transitionDefinition ) {
						self.addTransition( transitionName, transitionDefinition );
					}
				}, function ( category, fn ) {
					definition[category] && Z.each( definition[category], fn );
				});
		
				this.emit( 'construct', { definition: definition } );
		
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
						!Z.isEmpty( data ) && !Z.isEmpty( edit ) && excise( true, data, edit )
						:
						Z.isEmpty( edit ) || Z.extend( true, data, edit )
					) &&
						this.emit( 'mutate', { edit: edit, isDeletion: isDeletion } );
					return this;
				} else { // get
					return Z.isEmpty( data ) ?
						undefined
						:
						Z.extend( true, {},
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
				var	superstate, protostate,
					method = methods[ methodName ];
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					method !== Z.noop && method
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && ( superstate = this.superstate() ) && superstate.method( methodName, true, viaProto )
						||
					method
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
					method = methods[ methodName ],
					result = {};
		
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
		
				return (
					( result.method = method ) && method !== Z.noop && ( result.context = this, result )
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
				return Z.keys( methods );
			};
		},

		addMethod: function ( methods ) {
			/**
			 * Returns a function that forwards a `methodName` call to `controller`, which will
			 * itself then forward the call on to the appropriate implementation in the state
			 * hierarchy as determined by the controller's current state.
			 * 
			 * The context of autochthonous methods relocated to the default state remains bound to
			 * the owner, whereas stateful methods are executed in the context of the state in which
			 * they are declared, or if the implementation resides in a protostate, the context will
			 * be the corresponding `StateProxy` within `controller`.
			 */
			function applyDelegate ( methodName, controller ) {
				function delegate () { return controller.current().apply( methodName, arguments ); }
				delegate.isDelegate = true;
				return delegate;
			}

			/**
			 * Adds a method to this state, which will be callable directly from the owner, but with
			 * its context bound to the state.
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
							ownerMethod.autochthonousToOwner = Z.hasOwn.call( owner, methodName );
						} else {
							/*
							 * Otherwise, since the method being added has no counterpart on the owner, a
							 * no-op is placed on the default state instead. Consequently the added method
							 * may be called no matter which state the controller is in, though it 
							 */
							ownerMethod = Z.noop;
						}
						defaultState.addMethod( methodName, ownerMethod );
					}
					/*
					 * A delegate function is instated on the owner, which will direct subsequent calls to
					 * `owner[ methodName ]` to the controller, and then on to the appropriate state's
					 * implementation.
					 */
					owner[ methodName ] = applyDelegate( methodName, controller );
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
			 * handler. Recognized event types are listed at `StateEvent.types`.
			 * @see StateEvent
			 */
			return function ( /*String*/ eventType, /*Function*/ fn ) {
				if ( eventType in events ) {
					events[ eventType ] ||
						( events[ eventType ] = new StateEventCollection( this, eventType ) );
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

		emit: function ( events ) {
			/** Used internally to invoke an event type's handlers at the appropriate time. */
			return function ( /*String*/ eventType, /*Object*/ data ) {
				var e;
				return eventType in events && ( e = events[ eventType ] ) && e.emit( data ) && this;
			};
		},

		guard: function ( guards ) {
			/**
			 * Gets a guard object for this state. Guards are inherited from protostates, but not from
			 * superstates.
			 */
			return function ( /*String*/ guardType ) {
				var protostate;
				return (
					guards[ guardType ]
						||
					( protostate = this.protostate() ) && protostate.guard( guardType )
					 	||
					undefined
				);
			};
		},

		addGuard: function ( guards ) {
			/** Adds a guard to the state. */
			return function ( /*String*/ guardType, guard ) {
				guards[ guardType ] = guard;
			};
		},

		removeGuard: function ( guards ) {
			/** */
			return function ( /*String*/ guardType, /*String*/ guardKey ) {
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
				for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
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
							substate === transition.target()
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
				return Z.extend( true, {}, transitions );
				// var i, result = [];
				// for ( i in transitions ) if ( Z.hasOwn.call( transitions, i ) ) {
				// 	result.push( transitions[i] );
				// }
				// return result;
			};
		},

		addTransition: function ( transitions ) {
			/** */
			return function ( /*String*/ transitionName, /*StateTransitionDefinition | Object*/ transitionDefinition ) {
				transitionDefinition instanceof StateTransitionDefinition ||
					( transitionDefinition = StateTransitionDefinition( transitionDefinition ) );
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
					origin, target, methodName, method, stateName;
		
				if ( transition ) {
					origin = transition.origin();
					target = transition.target();
					if (
						this === origin || this.isSuperstateOf( origin )
							||
						this === target || this.isSuperstateOf( target )
					) {
						// TODO: instead of failing, defer destroy() until after transition.end()
						return false;
					}
				}
		
				if ( superstate ) {
					superstate.removeSubstate( name );
				} else {
					for ( methodName in methods ) if ( Z.hasOwn.call( methods, methodName ) ) {
						// It's the default state being destroyed, so the delegates on the owner can be deleted.
						Z.hasOwn.call( owner, methodName ) && delete owner[ methodName ];
				
						// A default state may have been holding methods for the owner, which it must give back.
						if ( ( method = methods[ methodName ] ).autochthonousToOwner ) {
							delete method.autochthonous;
							delete method.autochthonousToOwner;
							owner[ methodName ] = method;
						}
					}
				}
				for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
					substates[ stateName ].destroy();
				}
				setSuperstate( undefined );
				setDestroyed( true );
				this.emit( 'destroy' );
		
				return true;
			};
		}
	});
	
	// Aliases
	Z.extend( this, {
		on: this.addEvent,
		trigger: this.emit
	});
};
	
Z.extend( true, State, {
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
		protostate: function () { //// TODO: needs better prototype extraction; needs more unit tests
			var	derivation = this.derivation( true ),
				controller = this.controller(),
				controllerName = controller.name(),
				owner = controller.owner(),
				prototype = owner,
				protostate, i, l, stateName;
			
			function iterate () {
				prototype = prototype.__proto__ || prototype.constructor.prototype;
				protostate = prototype &&
						Z.hasOwn.call( prototype, controllerName ) &&
						prototype[ controllerName ] instanceof StateController ?
					prototype[ controllerName ].defaultState() :
					undefined;
			}
			
			for ( iterate(); protostate; iterate() ) {
				for ( i = 0, l = derivation.length; i < l; i++ ) {
					if ( !( protostate = protostate.substate( derivation[i], false ) ) ) {
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
			return this.apply( methodName, Z.slice.call( arguments, 1 ) );
		},
		
		/** Determines whether `this` directly possesses a method named `methodName`. */
		hasMethod: function ( methodName ) {
			var method = this.method( methodName );
			return method && method !== Z.noop;
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
			} : Z.noop
		,
		
		/** */
		replaceHistory: global.history && global.history.replaceState ?
			function ( title, urlBase ) {
				return global.history.replaceState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
			} : Z.noop
		,
		
		/**
		 * Returns the Boolean result of the guard function at `guardName` defined on this state, as
		 * evaluated against `testState`, or `true` if no guard exists.
		 */
		evaluateGuard: function ( /*String*/ guardName, /*State*/ testState ) {
			var	state = this,
				guard = this.guard( guardName ),
				result;
			if ( guard ) {
				Z.each( guard, function ( selector, value ) {
					Z.each( selector.split(','), function ( i, expr ) {
						if ( state.match( Z.trim( expr ), testState ) ) {
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
				Z.each( parts, function ( i, name ) {
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
	}
});


function StateDefinition ( map ) {
	if ( !( this instanceof StateDefinition ) ) {
		return new StateDefinition( map );
	}
	Z.extend( true, this, map instanceof StateDefinition ? map : StateDefinition.expand( map ) );
}

Z.extend( true, StateDefinition, {
	categories: [ 'data', 'methods', 'events', 'guards', 'states', 'transitions' ],
	expand: function ( map ) {
		var key, value, category,
			result = Z.nullHash( this.categories ),
			eventTypes = Z.invert( StateEvent.types ),
			guardTypes = Z.invert([ 'admit', 'release' ]); // Z.invert( State.Guard.types );
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[key];
			
			// Priority 1 : strict type match opportunity for states and transitions
			// -- allows arbitrarily keyed values of `State({})` and `StateTransition({})`
			if ( category =
				value instanceof StateDefinition && 'states'
					||
				value instanceof StateTransitionDefinition && 'transitions'
			) {
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
			
			// Priority 2 : explicitly named category
			else if ( key in result ) {
				result[key] = Z.extend( result[key], value );
			}
			
			// Priority 3 : implicit categorization
			else {
				category = /^_*[A-Z]/.test( key ) ? 'states' :
						key in eventTypes ? 'events' :
						key in guardTypes ? 'guards' :
						'methods';
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
		}
		
		Z.each( result.events, function ( type, value ) {
			Z.isFunction( value ) && ( result.events[type] = value = [ value ] );
		});
		
		Z.each( result.transitions, function ( name, map ) {
			result.transitions[name] = map instanceof StateTransitionDefinition ? map : StateTransitionDefinition( map );
		});
		
		Z.each( result.states, function ( name, map ) {
			result.states[name] = map instanceof StateDefinition ? map : StateDefinition( map );
		});
		
		return result;
	}
});


function StateController ( owner, name, definition, options ) {
	if ( !( this instanceof StateController ) ) {
		return new StateController( owner, name, definition, options );
	}
	
	var	defaultState, currentState, transition, getName,
		self = this,
		privileged = StateController.privileged,
		args = overload( arguments, this.constructor.overloads );
	
	function setCurrentState ( value ) { return currentState = value; }
	function setTransition ( value ) { return transition = value; }
	
	// Rewrites for overloaded arguments
	( owner = args.owner || {} )[ name = args.name || 'state' ] = this;
	definition = args.definition instanceof StateDefinition ? args.definition : StateDefinition( args.definition );
	typeof ( options = args.options || {} ) === 'string' && ( options = { initialState: options } );
	
	// Expose these in debug mode
	Z.env.debug && Z.extend( this.__private__ = {}, {
		defaultState: defaultState,
		owner: owner,
		options: options
	});
	
	Z.extend( this, {
		owner: function () { return owner; },
		name: Z.stringFunction( function () { return name; } ),
		defaultState: function () { return defaultState; },
		current: Z.extend( function () { return currentState; }, {
			toString: function () { return currentState ? currentState.toString() : undefined; }
		}),
		transition: Z.extend( function () { return transition; }, {
			toString: function () { return transition ? transition.toString() : ''; }
		})
	});
	
	Z.constructPrivilegedMethods( this, StateController.privileged, {
		'change' : [ setCurrentState, setTransition ]
	});
	
	// Instantiate the default state and initialize it as the root of the state hierarchy
	( defaultState = Z.extend( new State(), {
		controller: function () { return self; }
	}) ).init( definition );
	
	currentState = options.initialState ? defaultState.match( options.initialState ) : defaultState;
	currentState.controller() === this || ( currentState = this.createProxy( currentState ) );
}

Z.extend( true, StateController, {
	overloads: {
		'object string object object' : 'owner name definition options',
		'object string object string' : 'owner name definition options',
		'object string object' : 'owner name definition',
		'object object object' : 'owner definition options',
		'object object string' : 'owner definition options',
		'string object object' : 'name definition options',
		'string object string' : 'name definition options',
		'object object' : 'owner definition',
		'string object' : 'name definition',
		'object string' : 'definition options',
		'object' : 'definition',
		'string' : 'name'
	},
	
	privileged: {
		/**
		 * Attempts to change the controller's current state. Handles asynchronous transitions, generation
		 * of appropriate events, and construction of temporary protostate proxies as necessary. Respects
		 * guards supplied in both the origin and target states, and fails appropriately if a matching
		 * guard disallows the change.
		 * 
		 * @param target:State
		 * @param options:Object Map of settings:
		 * 		forced:Boolean
		 * 			Overrides any guards defined, ensuring the change will complete, assuming a valid
		 * 			target.
		 * 		success:Function
		 * 			Callback to be executed upon successful completion of the change.
		 * 		failure:Function
		 * 			Callback to be executed if the change is blocked by a guard.
		 * @param setCurrentState:Function
		 * @param setTransition:Function
		 * 
		 * @see StateController.change
		 */
		change: function ( setCurrentState, setTransition ) {
			return function ( target, options ) {
				var	targetOwner, source, origin, domain, info, state,
					owner = this.owner(),
					transition = this.transition(),
					transitionDefinition,
					self = this;
			
				// Resolve `target` argument to a proper `State` object if necessary.
				target instanceof State || ( target = target ? this.get( target ) : this.defaultState() );
			
				if ( !target ||
						( targetOwner = target.owner() ) !== owner &&
						!targetOwner.isPrototypeOf( owner )
				) {
					throw new Error( "StateController: attempted a change to an invalid state" );
				}
			
				options || ( options = {} );
				origin = transition ? transition.origin() : this.current();
				if ( options.forced ||
						origin.evaluateGuard( 'release', target ) &&
						target.evaluateGuard( 'admit', origin )
				) {
					/*
					 * If `target` is a state from a prototype of `owner`, it must be represented here as a
					 * transient protostate proxy.
					 */
					target && target.controller() !== this && ( target = this.createProxy( target ) );
					
					// If a transition is underway, it needs to be notified that it won't finish.
					transition && transition.abort();
					
					source = state = this.current();
					domain = source.common( target );
					
					/*
					 * Retrieve the appropriate transition definition for this origin/target pairing;
					 * if none is defined then a default transition is created that will cause the callback
					 * to return immediately.
					 */
					transition = setTransition( new StateTransition(
						target,
						source,
						transitionDefinition = this.getTransitionDefinitionFor( target, origin )
					));
					info = { transition: transition, forced: !!options.forced };
					
					/*
					 * Walk up to the top of the domain, beginning with a 'depart' event, and bubbling 'exit'
					 * events at each step along the way.
					 */
					source.trigger( 'depart', info );
					setCurrentState( transition );
					transition.trigger( 'enter' );
					while ( state !== domain ) {
						state.trigger( 'exit', info );
						transition.attachTo( state = state.superstate() );
					}
					
					/*
					 * Provide an enclosed callback that will be called from `transition.end()` to conclude the
					 * `change` operation.
					 */
					transition.setCallback( function () {
						var pathToState = [];
						
						/*
						 * Trace a path from `target` up to `domain`, then walk down it, capturing 'enter'
						 * events along the way, and terminating with an 'arrive' event.
						 */
						for ( state = target; state !== domain; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.trigger( 'enter', info );
						}
						transition.trigger( 'exit' );
						setCurrentState( target );
						this.current().trigger( 'arrive', info );
						
						origin instanceof StateProxy && ( this.destroyProxy( origin ), origin = null );
						transition.destroy(), transition = setTransition( null );
						
						typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					return transition.start.apply( transition, options.arguments ) || this;
				} else {
					typeof options.failure === 'function' && options.failure.call( this );
					return false;
				}
			}
		},
	},
	
	prototype: {
		toString: function () {
			return this.current().toString();
		},
		match: function ( expr, testState ) {
			return this.current().match( expr, testState );
		},
		get: function ( expr, context ) {
			return expr === undefined ? this.current() : ( context || this ).match( expr );
		},
		is: function ( expr, context ) {
			return ( expr instanceof State ? expr : this.get( expr, context ) ) === this.current();
		},
		isIn: function ( expr, context ) {
			return this.current().isIn( expr instanceof State ? expr : this.get( expr, context ) );
		},
		
		/**
		 * Creates a StateProxy within the state hierarchy of `this` to represent `protostate` temporarily,
		 * along with as many proxy superstates as are necessary to reach a `State` in the hierarchy.
		 */
		createProxy: function ( protostate ) {
			var	derivation, state, next, name;
			function iterate () {
				return state.substate( ( name = derivation.shift() ), false );
			}
			if ( protostate instanceof State &&
				protostate.owner().isPrototypeOf( this.owner() ) &&
				( derivation = protostate.derivation( true ) ).length
			) {
				for ( state = this.defaultState(), next = iterate();
						next;
						state = next, next = iterate() );
				while ( name ) {
					state = new StateProxy( state, name );
					name = derivation.shift();
				}
				return state;
			}
		},
		
		/**
		 * Destroys `proxy` and all of its StateProxy superstates.
		 */
		destroyProxy: function ( proxy ) {
			var superstate;
			while ( proxy instanceof StateProxy ) {
				superstate = proxy.superstate();
				proxy.destroy();
				proxy = superstate;
			}
		},
		
		/**
		 * Finds the appropriate transition definition for the given origin and target states. If no
		 * matching transitions are defined in any of the states, returns a generic transition definition
		 * for the origin/target pair with no `operation`.
		 */
		getTransitionDefinitionFor: function ( target, origin ) {
			origin || ( origin = this.current() );
			
			function search ( state, until ) {
				var result;
				for ( ; state && state !== until; state = until ? state.superstate() : undefined ) {
					Z.each( state.transitions(), function ( i, definition ) {
						return !(
							( definition.target ? state.match( definition.target, target ) : state === target ) &&
							( !definition.origin || state.match( definition.origin, origin ) ) &&
						( result = definition ) );
					});
				}
				return result;
			}
			
			// Search order: (1) `target`, (2) `origin`, (3) superstates of `target`, (4) superstates of `origin`
			return (
				search( target ) ||
				origin !== target && search( origin ) ||
				search( target.superstate(), this.defaultState() ) || search( this.defaultState() ) ||
				!target.isIn( origin ) && search( origin.superstate(), origin.common( target ) ) ||
				new StateTransitionDefinition()
			);
		},
		
		addState: function ( stateName, stateDefinition ) {
			return this.defaultState().addSubstate( stateName, stateDefinition );
		},
		
		removeState: function ( stateName ) {
			return this.defaultState().removeSubstate( stateName );
		},
		
		method: function ( methodName ) {
			return this.current().method( methodName );
		},
		
		superstate: function ( methodName ) {
			var superstate = this.current().superstate();
			return methodName === undefined ? superstate : superstate.method( methodName );
		},
		
		destroy: function () {
			return this.defaultState().destroy() && delete this.owner()[ this.name() ];
		}
	}
});


function StateEvent ( state, type ) {
	Z.extend( this, {
		target: state,
		name: state.name,
		type: type
	});
}

Z.extend( true, StateEvent, {
	types: [ 'construct', 'destroy', 'depart', 'exit', 'enter', 'arrive', 'mutate' ],
	prototype: {
		toString: function () {
			return 'StateEvent (' + this.type + ') ' + this.name;
		},
		log: function ( text ) {
			console && console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
		}
	}
});

function StateEventCollection ( state, type ) {
	var	items = {},
		length = 0;
	
	Z.extend( this, {
		length: Z.valueFunction( function () { return length } ),
		get: function ( id ) {
			return items[id];
		},
		key: function ( listener ) {
			for ( var i in items ) if ( Z.hasOwn.call( items, i ) ) {
				if ( items[i] === listener ) {
					return i;
				}
			}
		},
		keys: function () {
			var result = [], i;
			result.toString = function () { return '[' + result.join() + ']'; };
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				result.push( items[i] );
			}
			return result;
		},
		add: function ( fn ) {
			var id = this.guid();
			items[id] = fn;
			length++;
			return id;
		},
		remove: function ( id ) {
			var fn = items[id];
			if ( fn ) {
				delete items[id];
				length--;
				return fn;
			}
			return false;
		},
		empty: function () {
			if ( length ) {
				for ( var i in items ) if ( Z.hasOwn.call( items, i ) ) {
					delete items[i];
				}
				length = 0;
				return true;
			} else {
				return false;
			}
		},
		emit: function ( data ) {
			for ( var i in items ) if ( Z.hasOwn.call( items, i ) ) {
				items[i].apply( state, [ Z.extend( new StateEvent( state, type ), data ) ] );
			}
		}
	});
	
	this.on = this.add;
	this.trigger = this.emit;
}

Z.extend( true, StateEventCollection, {
	__guid__: 0,
	prototype: {
		guid: function () {
			return ( ++this.constructor.__guid__ ).toString();
		}
	}
});


/**
 * StateProxy allows a state controller to reference a protostate from within its own state hierarchy.
 */
function StateProxy ( superstate, name ) {
	var	getName;
	Z.extend( this, {
		superstate: function () { return superstate; },
		name: ( getName = function () { return name || ''; } ).toString = getName,
		
		// TODO: implement `invalidate`
		// If protostate gets destroyed or removed, it should invalidate this proxy 
		invalidate: function () {
			// tell controller to eject itself
		}
	});
}

Z.extend( true, StateProxy, {
	prototype: Z.extend( true, new State( null, "[StateProxy prototype]" ), {
		guard: function ( guardName ) {
			// TODO: this.protostate() isn't resolving when it should
					// CAUSE: derived object doesn't have its StateController.name set, so it can't match with prototype's StateController
			if ( !this.protostate() ) {
				// debugger;
			}
			return this.protostate().guard( guardName );
		}
	})
});


function StateTransition ( target, source, definition, callback ) {
	if ( !( this instanceof StateTransition ) ) {
		return StateTransitionDefinition.apply( this, arguments );
	}
	
	var	deferral,
		methods = {},
		events = Z.nullHash( StateTransition.Event.types ),
		guards = {},
		operation = definition.operation,
		self = this,
		attachment = source,
	 	controller = ( controller = source.controller() ) === target.controller() ? controller : undefined,
		aborted;
	
	function setDefinition ( value ) { return definition = value; }
	
	// expose these in debug mode
	Z.env.debug && Z.extend( this.__private__ = {}, {
		methods: methods,
		events: events,
		guards: guards,
		operation: operation
	});
	
	Z.extend( this, {
		/**
		 * `superstate` is used here to track the transition's position as it walks the State subtree domain.
		 */
		superstate: function () { return attachment; },
		
		/**
		 * 
		 */
		attachTo: function ( state ) { attachment = state; },
		
		/**
		 * 
		 */
		controller: function () { return controller; },
		
		/**
		 * 
		 */
		definition: function () { return definition; },
		
		/**
		 * 
		 */
		origin: function () { return source instanceof StateTransition ? source.origin() : source; },
		
		/**
		 * 
		 */
		source: function () { return source; },
		
		/**
		 * 
		 */
		target: function () { return target; },
		
		/**
		 * 
		 */
		setCallback: function ( fn ) { callback = fn; },
		
		/**
		 * 
		 */
		aborted: function () { return aborted; },
		
		promise: function () {
			if ( deferral ) {
				return deferral.promise();
			}
		},
		
		execute: function ( op ) {
			// [
			// 	fn1,
			// 	[[
			// 		fn2,
			// 		[[
			// 			fn3,
			// 			fn4
			// 		]],
			// 		[
			// 			fn5,
			// 			fn6
			// 		]
			// 	]],
			// 	[
			// 		fn7,
			// 		fn8
			// 	]
			// ]
			// 
			// Deferral
			// 	.then( fn1 )
			// 	.then( function () { return when(
			// 		Deferral.then( fn2 ),
			// 		Deferral.then( function () { return when(
			// 			Deferral.then( fn3 ),
			// 			Deferral.then( fn4 )
			// 		} )),
			// 		Deferral
			// 			.then( fn5 )
			// 			.then( fn6 )
			// 	} ))
			// 	.then( function () { return Deferral
			// 		.then( fn7 )
			// 		.then( fn8 )
			// 	} )
			// );
			
			function parse ( obj, promise ) {
				var arr, next, i, l;
				function parallel ( deferrals ) {
					return function () {
						var d, result = when( deferrals );
						// while ( d = deferrals.shift() ) d.fulfill( d, [self] );
						return result;
					}
				}
				if ( Z.isFunction( obj ) ) {
					return promise ? promise.then( obj ) : new Deferral( obj );
					// return ( promise || ( new Deferral ) ).then( obj );
				} else if ( Z.isArray( obj ) ) {
					i = 0;
					if ( obj.length === 1 && Z.isArray( obj[0] ) ) {
						// double array, interpret as parallel/asynchronous
						for ( arr = [], obj = obj[0], l = obj.length; i < l; ) {
							arr.push( parse( obj[i++], new Deferral ) );
						}
						return promise ? promise.then( parallel( arr ) ) : parallel( arr )();
					} else {
						// single array, interpret as serial/synchronous
						for ( next = promise || ( promise = new Deferral ), l = obj.length; i < l; ) {
							next = next.then( parse( obj[i++], next ) );
						}
						return promise;
					}
				}
			}
			
			var deferral = new Deferral;
			parse( op, deferral );
			return deferral;
		},
		
		/**
		 * 
		 */
		start: function () {
			var self = this;
			aborted = false;
			this.trigger( 'start' );
			if ( Z.isFunction( operation ) ) {
				// deferral = new Deferral();
				// add contents of `operation` to deferral
				operation.apply( this, arguments );
				// deferral.
				// return deferral.promise();
			} else if ( Z.isArray( operation ) ) {
				// return ( this.omg( operation )
				// 	.done( function () { self.end(); } )
				// 	.fulfill( this )
				// );
				var d = this.execute( operation );
				d.done( function () { self.end(); } );
				return d.fulfill( this );
			} else {
				return this.end();
			}
		},
		
		/**
		 * 
		 */
		abort: function () {
			aborted = true;
			callback = null;
			this.trigger( 'abort' );
			return this;
		},
		
		/**
		 * 
		 */
		end: function ( delay ) {
			if ( delay ) {
				return setTimeout( function () { self.end(); }, delay );
			}
			if ( !aborted ) {
				this.trigger( 'end' );
				callback && callback.apply( controller );
			}
			// TODO: check for deferred state destroy() calls
			this.destroy();
		},
		
		/**
		 * 
		 */
		destroy: function () {
			source instanceof StateTransition && source.destroy();
			target = attachment = controller = null;
		}
	});
	
	Z.constructPrivilegedMethods( this, State.privileged, {
		'init' : [ StateTransitionDefinition, setDefinition ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events on addEvent removeEvent emit trigger' : [ events ],
	});
	
	this.init();
}

Z.extend( true, StateTransition, {
	prototype: Z.extend( true, new State(), {
		depth: function () {
			for ( var count = 0, t = this; t.source() instanceof StateTransition; count++, t = t.source() );
			return count;
		}
	}),
	
	Event: {
		types: [ 'construct', 'destroy', 'enter', 'exit', 'start', 'end', 'abort' ]
	}
});

function StateTransitionDefinition ( map ) {
	var D = StateTransitionDefinition;
	if ( !( this instanceof D ) ) {
		return new D( map );
	}
	Z.extend( true, this, map instanceof D ? map : D.expand( map ) );
}

Z.extend( StateTransitionDefinition, {
	properties: [ 'origin', 'source', 'target', 'operation' ],
	categories: [ 'methods', 'events' ],
	expand: function ( map ) {
		var	properties = Z.nullHash( this.properties ),
			categories = Z.nullHash( this.categories ),
			result = Z.extend( {}, properties, categories ),
			eventTypes = Z.invert( StateTransition.Event.types ),
			key, value, category;
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[key];
			if ( key in properties ) {
				result[key] = value;
			}
			else if ( key in categories ) {
				Z.extend( result[key], value );
			}
			else {
				category = key in eventTypes ? 'events' : 'methods';
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
		}
		Z.each( result.events, function ( type, value ) {
			Z.isFunction( value ) && ( result.events[type] = value = [ value ] );
		});
		return result;
	}
});


})();

