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
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z,

	STATE_ATTRIBUTES = {
		NORMAL      : 0x0,
		VIRTUAL     : 0x1,
		INITIAL     : 0x2,
		FINAL       : 0x4,
		DEFAULT     : 0x8,
		ABSTRACT    : 0x10,
		SEALED      : 0x20,
		REGIONED    : 0x40
	},

	STATE_DEFINITION_CATEGORIES =
		'data methods events guards states transitions',
	
	STATE_EVENT_TYPES =
		'construct depart exit enter arrive destroy mutate',
	
	GUARD_ACTIONS =
		'admit release',
	
	TRANSITION_PROPERTIES =
		'origin source target action',
	
	TRANSITION_DEFINITION_CATEGORIES =
		'methods events',
	
	TRANSITION_EVENT_TYPES =
		'construct destroy enter exit start end abort';

/**
 * The exported module is a function, which returns either a `StateDefinition` or
 * a `StateController` bound to an owner object:
 * 
 * StateDefinition state( [String modifiers,] Object definition )
 * StateController state( [String modifiers,] Object owner, [String name,] Object definition [, Object|String options] )
 * 
 * @see StateDefinition
 * @see StateController
 */
function state ( attributes, owner, name, definition, options ) {
	typeof attributes === 'string' || ( options = definition, definition = name, name = owner,
		owner = attributes, attributes = null );
	if ( name === undefined && definition === undefined && options === undefined ) {
		return new StateDefinition( attributes, definition = owner )
	}

	typeof name === 'string' || ( options = definition, definition = name, name = null );
	return new StateController( owner, name || 'state',
		new StateDefinition( attributes, definition ), options );
}

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

Z.assign( state, {
	VERSION: '0.0.1',

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});

var State = ( function () {
	Z.assign( State, STATE_ATTRIBUTES );

	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			return new State( superstate, name, definition );
		}
		
		var attributes = definition && definition.attributes || STATE_ATTRIBUTES.NORMAL;
		
		this.name = Z.stringFunction( function () { return name || ''; } );
		this.attributes = function () { return attributes; };
		
		Z.privilege( this, State.privileged, {
			'superstate' : [ superstate ]
		});

		if ( attributes & STATE_ATTRIBUTES.VIRTUAL ) {
			this.reify = function () {
				delete this.reify;
				return reify.call( this, superstate, definition );
			};
		} else {
			reify.call( this, superstate, definition );
		}
	}

	function reify ( superstate, definition ) {
		var	destroyed = false,
			data = {},
			methods = {},
			events = Z.assign( STATE_EVENT_TYPES, null ),
			guards = {},
			substates = {},
			transitions = {};
		
		// expose these in debug mode
		Z.env.debug && Z.assign( this.__private__ = {}, {
			attributes: this.attributes(),
			data: data,
			methods: methods,
			events: events,
			guards: guards,
			substates: substates,
			transitions: transitions
		});
		
		/*
		 * Setter functions are passed to privileged method factories to provide access to local
		 * variables.
		 */
		function setSuperstate ( value ) { return superstate = value; }
		function setDestroyed ( value ) { return destroyed = !!value; }
		
		/*
		 * Method names are mapped to specific local variables. The named methods are created on
		 * `this`, each of which is a partial application of its corresponding method factory at
		 * `State.privileged`.
		 */
		Z.privilege( this, State.privileged, {
			'init' : [ StateDefinition ],
			'superstate' : [ superstate ],
			'data' : [ data ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event addEvent removeEvent emit' : [ events ],
			'guard addGuard removeGuard' : [ guards ],
			'substate substates addSubstate removeSubstate' : [ substates ],
			'transition transitions addTransition' : [ transitions ],
			'destroy' : [ setSuperstate, setDestroyed, methods, substates ]
		});
		Z.alias( this, { addEvent: 'on', emit: 'trigger' } );

		/*
		 * If no superstate, e.g. a default state being created by a `StateController`, then
		 * `init()` must be called later by the implementor.
		 */
		superstate && this.init( definition );

		return this;
	}

	function createDelegate ( methodName, controller ) {
		/**
		 * Forwards a `methodName` call to `controller`, which will then forward the call on to the
		 * appropriate implementation in the state hierarchy as determined by the controller's
		 * current state.
		 * 
		 * The context of autochthonous methods relocated to the default state remains bound to the
		 * owner, whereas stateful methods are executed in the context of the state in which they
		 * are declared, or if the implementation resides in a protostate, the context will be the
		 * corresponding `StateProxy` within `controller`.
		 * 
		 * @see State.privileged.addMethod
		 */
		function delegate () {
			return controller.current().apply( methodName, arguments );
		}
		delegate.isDelegate = true;
		return delegate;
	}

	State.privileged = {
		init: function ( /*Function*/ definitionConstructor ) {
			/**
			 * Builds out the state's members based on the contents of the supplied definition.
			 */
			return function ( /*<definitionConstructor>|Object*/ definition ) {
				var	category,
					self = this;
				
				definition instanceof definitionConstructor ||
					( definition = definitionConstructor( definition ) );
				
				definition.data && this.data( definition.data );
				Z.forEach({
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
				}, function ( fn, category ) {
					definition[ category ] && Z.each( definition[ category ], fn );
				});
		
				this.emit( 'construct', { definition: definition } );
		
				return this;
			};
		},

		superstate: function ( /*State*/ superstate ) {
			/**
			 * Returns the immediate superstate, or the nearest state in the superstate chain with
			 * the provided `stateName`.
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
			 * Gets the `data` attached to this state, including all data from inherited states,
			 * unless specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
			 * 
			 * ( Object edit, [Boolean isDeletion] )
			 * Sets the `data` on this state, overwriting any existing items, or if `!!isDeletion`
			 * is `true`, deletes from `data` the items with matching keys in `edit` whose values
			 * evaluate to `true`. If the operation causes `data` to be changed, a `mutate` event
			 * is generated for this state.
			 */
			return function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				var viaSuper, viaProto, key, superstate, protostate;

				// If first argument is a Boolean, interpret method call as a "get" with
				// inheritance flags.
				if ( typeof edit === 'boolean' ) {
					viaSuper = edit, viaProto = isDeletion, edit = false;
				}

				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				// set
				if ( edit ) {
					( isDeletion ?
						!Z.isEmpty( data ) && !Z.isEmpty( edit ) && Z.excise( true, data, edit )
						:
						Z.isEmpty( edit ) || Z.extend( true, data, edit )
					) &&
						this.emit( 'mutate', { edit: edit, isDeletion: isDeletion } );
					return this;
				}

				// get
				else {
					return Z.isEmpty( data ) ?
						undefined
						:
						Z.extend( true, {},
							viaSuper && ( superstate = this.superstate() ) &&
								superstate.data(),
							viaProto && ( protostate = this.protostate() ) &&
								protostate.data( false ),
							data
						);
				}
			}
		},

		method: function ( methods ) {
			/**
			 * Retrieves the named method held on this state. If no method is found, step through
			 * this state's protostate chain to find one. If no method is found there, step up the
			 * superstate hierarchy and repeat the search.
			 */
			return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
				var	superstate, protostate,
					method = methods[ methodName ];
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					method !== Z.noop && method
						||
					viaProto && ( protostate = this.protostate() ) &&
							protostate.method( methodName, false, true )
						||
					viaSuper && ( superstate = this.superstate() ) &&
							superstate.method( methodName, true, viaProto )
						||
					method
				);
			};
		},

		methodAndContext: function ( methods ) {
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will
			 * be referenced by `this` within the function.
			 */
			return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
				var	superstate, protostate,
					method = methods[ methodName ],
					result = {};
		
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
		
				return (
					( result.method = method ) && method !== Z.noop &&
							( result.context = this, result )
						||
					viaProto && ( protostate = this.protostate() ) &&
							( result = protostate.methodAndContext( methodName, false, true ) ) &&
							( result.context = this, result )
						||
					viaSuper && ( superstate = this.superstate() ) &&
							superstate.methodAndContext( methodName, true, viaProto )
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
			 * Adds a method to this state, which will be callable directly from the owner, but
			 * with its context bound to the state.
			 */
			return function ( methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner(),
					ownerMethod;
				
				/*
				 * If there is not already a method called `methodName` in the state hierarchy,
				 * then the owner and controller need to be set up properly to accommodate calls
				 * to this method.
				 */
				if ( !this.method( methodName, true, false ) ) {

					if ( this !== defaultState &&
							!defaultState.method( methodName, false, false ) ) {
						
						if ( ( ownerMethod = owner[ methodName ] ) !== undefined &&
								!ownerMethod.isDelegate ) {
							/*
							 * If the owner has a method called `methodName` that hasn't already
							 * been substituted with a delegate, then that method needs to be
							 * copied into to the default state, so that calls made from other
							 * states which do not implement this method can be forwarded to this
							 * original implementation of the owner. Before the method is copied,
							 * it is marked both as `autochthonous` to indicate that subsequent
							 * calls to the method should be executed in the context of the owner
							 * (as opposed to the usual context of the state for which the method
							 * was declared), and, if the method was not inherited from a prototype
							 * of the owner, as `autochthonousToOwner` to indicate that it must be
							 * returned to the owner should the controller ever be destroyed.
							 */
							ownerMethod.autochthonous = true;
							ownerMethod.autochthonousToOwner = Z.hasOwn.call( owner, methodName );
						}

						else {
							/*
							 * Otherwise, since the method being added has no counterpart on the
							 * owner, a no-op is placed on the default state instead. Consequently
							 * the added method may be called no matter which state the controller
							 * is in ....
							 */
							ownerMethod = Z.noop;
						}
						defaultState.addMethod( methodName, ownerMethod );
					}

					/*
					 * A delegate function is instated on the owner, which will direct subsequent
					 * calls to `owner[ methodName ]` to the controller, and then on to the
					 * appropriate state's implementation.
					 */
					owner[ methodName ] = createDelegate( methodName, controller );
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

		addEvent: function ( events ) {
			/**
			 * Binds an event handler to the specified `eventType` and returns a unique identifier
			 * for the handler. Recognized event types are listed at `StateEvent.types`.
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
			/** Invokes an event type's handlers at the appropriate time. */
			return function ( /*String*/ eventType, /*Object*/ data ) {
				var e;
				return eventType in events && ( e = events[ eventType ] ) && e.emit( data ) && this;
			};
		},

		guard: function ( guards ) {
			/**
			 * Gets a guard object for this state. Guards are inherited from protostates, but not
			 * from superstates.
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

				return substates[ stateName ] ||
					viaProto && (
						( protostate = this.protostate() ) ?
							protostate.substate( stateName ) :
							undefined
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
					result.push( substates[ key ] );
					deep && ( result = result.concat( substates[ key ].substates( true ) ) );
				}
				return result;
			};
		},

		addSubstate: function ( substates ) {
			/**
			 * Creates a state from the supplied `stateDefinition` and adds it as a substate of
			 * this state. If a substate with the same `stateName` already exists, it is first
			 * destroyed and then replaced. If the new substate is being added to the controller's
			 * default state, a reference is added directly on the controller itself as well.
			 */
			return function ( /*String*/ stateName, /*StateDefinition | Object*/ stateDefinition ) {
				var	substate, controller;
				
				if ( this.isSealed() ) {
					throw new Error;
				}

				( substate = substates[ stateName ] ) && substate.destroy();
				
				substate = this[ stateName ] = substates[ stateName ] =
					new State( this, stateName, stateDefinition );
				
				controller = this.controller();
				controller.defaultState() === this && ( controller[ stateName ] = substate );
				
				return substate;
			};
		},

		removeSubstate: function ( substates ) {
			/** */
			return function ( /*String*/ stateName ) {
				var	controller, current, transition,
					substate = substates[ stateName ];

				if ( !substate ) return;

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
			};
		},

		addTransition: function ( transitions ) {
			/** */
			return function (
				/*String*/ transitionName,
				/*TransitionDefinition | Object*/ transitionDefinition
			) {
				transitionDefinition instanceof TransitionDefinition ||
					( transitionDefinition = TransitionDefinition( transitionDefinition ) );
				
				return transitions[ transitionName ] = transitionDefinition;
			};
		},

		destroy: function ( setSuperstate, setDestroyed, methods, substates ) {
			/**
			 * Attempts to cleanly destroy this state and all of its substates. A 'destroy' event is
			 * issued to each state after it is destroyed.
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
						// It's the default state being destroyed, so the delegates on the owner can
						// be deleted.
						Z.hasOwn.call( owner, methodName ) && delete owner[ methodName ];
				
						// A default state may have been holding methods for the owner, which it
						// must give back.
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
	};

	Z.assign( State.prototype, {
		name : Z.thunk(''),
		attributes : Z.thunk( STATE_ATTRIBUTES.NORMAL ),
		'reify superstate method addMethod removeMethod event addEvent removeEvent guard addGuard \
		 removeGuard substate addSubstate removeSubstate transition addTransition' : Z.noop,
		data : Z.getThis,
		'methodNames substates' : function () { return []; },
		'transitions' : function () { return {}; },
		destroy : Z.thunk( false ),

		/** Returns this state's fully qualified name. */
		toString: function () {
			return this.derivation( true ).join('.');
		},
		
		isVirtual:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.VIRTUAL ); },
		isInitial:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.INITIAL ); },
		isDefault:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.DEFAULT ); },
		isFinal:     function () { return !!( this.attributes() & STATE_ATTRIBUTES.FINAL ); },
		isAbstract:  function () { return !!( this.attributes() & STATE_ATTRIBUTES.ABSTRACT ); },
		isSealed:    function () { return !!( this.attributes() & STATE_ATTRIBUTES.SEALED ); },
		isRegioned:  function () { return !!( this.attributes() & STATE_ATTRIBUTES.REGIONED ); },

		/** Gets the `StateController` to which this state belongs. */
		controller: function () {
			var superstate = this.superstate();
			if ( superstate ) {
				return superstate.controller();
			}
		},
		
		/** Gets the owner object to which this state's controller belongs. */
		owner: function () {
			var controller = this.controller();
			if ( controller ) {
				return controller.owner();
			}
		},
		
		/** Gets the default state, i.e. the top-level superstate of this state. */
		defaultState: function () {
			var controller = this.controller();
			if ( controller ) {
				return controller.defaultState();
			}
		},
		
		/** Returns the first substate marked 'default', or simply the first substate. */
		defaultSubstate: function () {
			var substates = this.substates(), i = 0, l = substates && substates.length;
			if ( !l ) return;
			for ( ; i < l; i++ ) {
				if ( substates[i].isDefault() ) {
					return substates[i];
				}
			}
			return substates[0];
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
		protostate: function () {
			var	derivation = this.derivation( true ),
				controller = this.controller(),
				controllerName, owner, prototype, protostate, i, l, stateName;
			
			function iterate () {
				var fn, c;
				prototype = Z.getPrototypeOf( prototype );
				protostate = prototype &&
					typeof prototype === 'object' &&
					Z.isFunction( fn = prototype[ controllerName ] ) &&
					( c = fn.apply( prototype ) ) &&
					c instanceof State ?
						c.defaultState() :
						null;
			}
			
			if ( !controller ) return;

			controllerName = controller.name();
			prototype = owner = controller.owner();
		
			for ( iterate(); protostate; iterate() ) {
				for ( i = 0, l = derivation.length; i < l; i++ ) {
					protostate = protostate.substate( derivation[i], false );
					if ( !protostate ) return;
				}
				return protostate;
			}
		},
		
		/**
		 * Returns an object array of this state's superstate chain, starting after the default
		 * state and ending at `this`.
		 * 
		 * @param byName Returns a string array of the states' names, rather than references
		 */
		derivation: function ( /*Boolean*/ byName ) {
			for ( var result = [], state, superstate = this;
					( state = superstate ) && ( superstate = state.superstate() );
					result.unshift( byName ? state.name() || '' : state ) );
			return result;
		},
		
		/**
		 * Returns the number of superstates this state has. The root default state returns `0`, its
		 * immediate substates return `1`, etc.
		 */
		depth: function () {
			for ( var count = 0, state = this, superstate;
					superstate = state.superstate();
					count++, state = superstate );
			return count;
		},
		
		/**
		 * Returns the least common ancestor of `this` and `other`. If `this` is itself an ancestor
		 * of `other`, or vice versa, that ancestor is returned.
		 */
		common: function ( /*State*/ other ) {
			var state;
			other instanceof State || ( other = this.match( other ) );
			for (
				this.depth() > other.depth() ?
						( state = other, other = this ) :
						( state = this );
					state;
					state = state.superstate() 
			) {
				if ( state === other || state.isSuperstateOf( other ) ) {
					return state;
				}
			}
		},
		
		/** Determines whether `this` is `state`. */
		is: function ( state ) {
			state instanceof State || ( state = this.match( state ) );
			return state === this;
		},

		/** Determines whether `this` is or is a substate of `state`. */
		isIn: function ( state ) {
			state instanceof State || ( state = this.match( state ) );
			return state === this || state.isSuperstateOf( this );
		},
		
		/** Determines whether `this` is a superstate of `state`. */
		isSuperstateOf: function ( state ) {
			var superstate;
			state instanceof State || ( state = this.match( state ) );
			
			return ( superstate = state.superstate() ) ?
				this === superstate || this.isSuperstateOf( superstate )
				:
				false;
		},
		
		/**
		 * Determines whether `this` is a state analogous to `state` on any object in the prototype
		 * chain of `state`'s owner.
		 */
		isProtostateOf: function ( state ) { //// untested
			var protostate;
			state instanceof State || ( state = this.match( state ) );

			return ( protostate = state.protostate() ) ?
				this === protostate || this.isProtostateOf( protostate )
				:
				false;
		},
		
		/**
		 * Finds a state method and applies it in the context of the state in which it was declared,
		 * or if the implementation resides in a protostate, the corresponding `StateProxy` in the
		 * calling controller.
		 * 
		 * If the method was autochthonous, i.e. it was already defined on the owner and
		 * subsequently "swizzled" onto the default state when the controller was constructed, then
		 * its function will have been marked `autochthonous`, and the method will thereafter be
		 * called in the original context of the owner.
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
		
		/** Determines whether `this` possesses or inherits a method named `methodName`. */
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
			state === undefined ?
				( state = this ) :
				state instanceof State || ( state = this.match( state ) );
			return this.controller().change( state ) && state;
		},
		
		/** Returns a `Boolean` indicating whether `this` is the controller's current state. */
		isSelected: function () {
			return this.controller().current() === this;
		},
		
		/** */
		pushHistory: global.history && global.history.pushState ?
			function ( title, urlBase ) {
				return global.history.pushState( this.data, title || this.toString(),
					urlBase + '/' + this.derivation( true ).join('/') );
			} : Z.noop
		,
		
		/** */
		replaceHistory: global.history && global.history.replaceState ?
			function ( title, urlBase ) {
				return global.history.replaceState( this.data, title || this.toString(),
					urlBase + '/' + this.derivation( true ).join('/') );
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
							result = !!( typeof value === 'function' ?
								value.apply( state, [ testState ] ) :
								value );
							return false; 
						}
					});
					return result === undefined;
				});
			}

			return result === undefined || result;
		},
		
		/**
		 * Matches a string expression `expr` with the state or states it represents, evaluated in
		 * the context of `this`.
		 * 
		 * Returns the matched state, the set of matched states, or a Boolean indicating whether
		 * `testState` is included in the matched set.
		 */
		match: function ( /*String*/ expr, /*State*/ testState ) {
			var	parts = expr && expr.split('.'),
				cursor = parts && parts.length && parts[0] === '' ?
					( parts.shift(), this ) :
					this.defaultState(),
				cursorSubstate, result, i, l, name;
			
			if ( !( parts && parts.length ) ) return cursor;

			for ( i = 0, l = parts.length; i < l; i++ ) {
				name = parts[i];
				if ( name === '' ) {
					cursor = cursor.superstate();
				} else if ( cursorSubstate = cursor.substate( name ) ) {
					cursor = cursorSubstate;
				} else if ( name === '*' ) {
					result = testState ?
						cursor === testState.superstate() :
						cursor.substates();
					break;
				} else if ( name === '**' ) {
					result = testState ?
						cursor.isSuperstateOf( testState ) :
						cursor.substates( true );
					break;
				} else {
					result = false;
					break;
				}
			}

			return result !== undefined ? result :
				!testState || cursor === testState ? cursor :
				false;
		},

		'change be become go goTo': function () {
			var controller = this.controller();
			return controller.change.apply( controller, arguments );
		}
	});

	return State;
})();


var StateDefinition = ( function () {
	var	categoryList   = Z.assign( STATE_DEFINITION_CATEGORIES ),
		eventTypes     = Z.assign( STATE_EVENT_TYPES ),
		guardActions   = Z.assign( GUARD_ACTIONS );

	function StateDefinition ( attributes, map ) {
		if ( !( this instanceof StateDefinition ) ) {
			return new StateDefinition( attributes, map );
		}
		map || ( map = attributes, attributes = undefined );
		
		Z.extend( true, this, map instanceof StateDefinition ? map : interpret( map ) );

		attributes == null || Z.isNumber( attributes ) || ( attributes = encode( attributes ) );
		this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
	}

	function encode ( attributes ) {
		var result = STATE_ATTRIBUTES.NORMAL;
		typeof attributes === 'string' && ( attributes = Z.assign( attributes ) );

		for ( key in attributes ) {
			if ( ( key = key.toUpperCase() ) in STATE_ATTRIBUTES ) {
				result |= STATE_ATTRIBUTES[ key ];
			}
		}
		return result;
	}

	function interpret ( map ) {
		var	key, value, category,
			result = Z.setAll( Z.extend( {}, categoryList ), null );
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			
			// Priority 1: nominative type match for items that are explicit definition instances
			category =
				value instanceof StateDefinition && 'states' ||
				value instanceof TransitionDefinition && 'transitions';
			if ( category ) {
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
			
			// Priority 2: explicitly named category object
			else if ( key in result ) {
				result[ key ] = Z.extend( result[ key ], value );
			}
			
			// Priority 3: implicit categorization
			else {
				category =
					key in eventTypes ? 'events' :
					key in guardActions ? 'guards' :
					Z.isPlainObject( value ) ? 'states' :
					'methods';
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
		}
		
		Z.each( result.events, function ( type, value ) {
			Z.isFunction( value ) && ( result.events[ type ] = value = [ value ] );
		});
		
		Z.each( result.transitions, function ( name, map ) {
			result.transitions[ name ] = map instanceof TransitionDefinition ?
				map :
				new TransitionDefinition( map );
		});
		
		Z.each( result.states, function ( name, map ) {
			result.states[ name ] = map instanceof StateDefinition ?
				map :
				new StateDefinition( map );
		});
		
		return result;
	}

	return StateDefinition;
})();


var StateController = ( function () {
	/**
	 * Creates a StateProxy within the state hierarchy of `this` to represent `protostate`
	 * temporarily, along with as many proxy superstates as are necessary to reach a `State` in
	 * the hierarchy.
	 */
	function createProxy ( protostate ) {
		var	derivation, state, next, name;
		function iterate () {
			return next = state.substate( ( name = derivation.shift() ), false );
		}
		if ( protostate instanceof State &&
			protostate.owner().isPrototypeOf( this.owner() ) &&
			( derivation = protostate.derivation( true ) ).length
		) {
			for ( state = this.defaultState(), iterate(); next; state = next, iterate() );
			while ( name ) {
				state = new StateProxy( state, name );
				name = derivation.shift();
			}
			return state;
		}
	}
	
	/**
	 * Destroys `proxy` and all of its StateProxy superstates.
	 */
	function destroyProxy ( proxy ) {
		var superstate;
		while ( proxy instanceof StateProxy ) {
			superstate = proxy.superstate();
			proxy.destroy();
			proxy = superstate;
		}
	}
	
	function StateController ( owner, name, definition, options ) {
		if ( !( this instanceof StateController ) ) {
			return new StateController( owner, name, definition, options );
		}
		
		var	self = this,
			defaultState, currentState, transition;
		
		function setCurrentState ( value ) { return currentState = value; }
		function setTransition ( value ) { return transition = value; }
		
		function accessor () {
			if ( this === owner ) {
				return arguments.length ? self.get.apply( self, arguments ) : self.current();
			} else {
				new StateController( this, name, null, self.current().toString() );
				return this[ name ].apply( this, arguments );
			}
		}

		owner || ( owner = {} );
		name || ( name = 'state' );
		definition instanceof StateDefinition || ( definition = new StateDefinition( definition ) );
		!options && ( options = {} ) ||
			typeof options === 'string' && ( options = { initialState: options } );
		
		owner[ name ] = accessor;

		// Expose these in debug mode
		Z.env.debug && Z.assign( this.__private__ = {}, {
			defaultState: defaultState,
			owner: owner,
			options: options
		});
		
		Z.assign( this, {
			owner: function () { return owner; },
			name: Z.stringFunction( function () { return name; } ),
			defaultState: function () { return defaultState; },
			current: Z.assign( function () { return currentState; }, {
				toString: function () { return currentState ? currentState.toString() : undefined; }
			}),
			transition: Z.assign( function () { return transition; }, {
				toString: function () { return transition ? transition.toString() : ''; }
			})
		});
		
		Z.privilege( this, StateController.privileged, {
			'change' : [ setCurrentState, setTransition ]
		});
		
		// Instantiate the default state and initialize it as the root of the state hierarchy
		defaultState = Z.assign( new State, {
			controller: function () { return self; }
		});
		defaultState.init( definition );
		
		// Establish the initial current state
		currentState = options.initialState ?
			defaultState.match( options.initialState ) : defaultState;
		currentState.controller() === this ||
			( currentState = createProxy.call( this, currentState ) );
	}

	StateController.privileged = {
		/**
		 * Attempts to change the controller's current state. Handles asynchronous transitions,
		 * generation of appropriate events, and construction of temporary protostate proxies as
		 * necessary. Respects guards supplied in both the origin and target states, and fails
		 * appropriately if a matching guard disallows the change.
		 * 
		 * @param target:State
		 * @param options:Object Map of settings:
		 * 		forced:Boolean
		 * 			Overrides any guards defined, ensuring the change will complete, assuming a
		 * 			valid target.
		 * 		success:Function
		 * 			Callback to be executed upon successful completion of the change.
		 * 		failure:Function
		 * 			Callback to be executed if the change is blocked by a guard.
		 * @param setCurrentState:Function
		 * @param setTransition:Function
		 */
		change: function ( setCurrentState, setTransition ) {
			return function ( target, options ) {
				var	owner, transition, targetOwner, source, origin, domain, info, state,
					transitionDefinition,
					self = this;

				owner = this.owner();
				transition = this.transition();
				origin = transition ? transition.origin() : this.current();

				if ( origin.isFinal() ) {
					throw new Error;
				}

				// Resolve `target` argument to a proper `State` object if necessary.
				target instanceof State ||
					( target = target ? this.get( target ) : this.defaultState() );
			
				if ( !target ||
						( targetOwner = target.owner() ) !== owner &&
						!targetOwner.isPrototypeOf( owner )
				) {
					throw new Error( "StateController: attempted a change to an invalid state" );
				}

				while ( target.isAbstract() ) {
					target = target.defaultSubstate();
					if ( !target ) {
						throw new Error;
					}
				}
				
				options || ( options = {} );
				if ( options.forced ||
						origin.evaluateGuard( 'release', target ) &&
						target.evaluateGuard( 'admit', origin )
				) {
					/*
					 * If `target` is a state from a prototype of `owner`, it must be represented
					 * here as a transient protostate proxy.
					 */
					target && target.controller() !== this &&
						( target = createProxy.call( this, target ) );
					
					// If a transition is underway, it needs to be notified that it won't finish.
					transition && transition.abort();
					
					source = state = this.current();
					domain = source.common( target );
					
					/*
					 * Retrieve the appropriate transition definition for this origin/target
					 * pairing; if none is defined then a default transition is created that will
					 * cause the callback to return immediately.
					 */
					transition = setTransition( new Transition(
						target,
						source,
						transitionDefinition = this.getTransitionDefinitionFor( target, origin )
					));
					info = { transition: transition, forced: !!options.forced };
					
					/*
					 * Walk up to the top of the domain, beginning with a 'depart' event, and
					 * bubbling 'exit' events at each step along the way.
					 */
					source.trigger( 'depart', info );
					setCurrentState( transition );
					transition.trigger( 'enter' );
					while ( state !== domain ) {
						state.trigger( 'exit', info );
						transition.attachTo( state = state.superstate() );
					}
					
					/*
					 * Provide an enclosed callback that will be called from `transition.end()` to
					 * conclude the `change` operation.
					 */
					transition.setCallback( function () {
						var pathToState = [];
						
						/*
						 * Trace a path from `target` up to `domain`, then walk down it, capturing
						 * 'enter' events along the way, and terminating with an 'arrive' event.
						 */
						for ( state = target; state !== domain; state = state.superstate() ) {
							pathToState.push( state );
						}
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.trigger( 'enter', info );
						}
						transition.trigger( 'exit' );
						setCurrentState( target );
						this.current().trigger( 'arrive', info );
						
						if ( origin instanceof StateProxy ) {
							destroyProxy.call( this, origin );
							origin = null;
						}
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
		}
	};
		
	Z.assign( StateController.prototype, {
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
		 * Finds the appropriate transition definition for the given origin and target states. If
		 * no matching transitions are defined in any of the states, returns a generic actionless
		 * transition definition for the origin/target pair.
		 */
		getTransitionDefinitionFor: function ( target, origin ) {
			origin || ( origin = this.current() );
			
			function search ( state, until ) {
				var result;
				for ( ; state && state !== until; state = until ? state.superstate() : undefined ) {
					Z.each( state.transitions(), function ( i, definition ) {
						return !(
							( definition.target ?
								state.match( definition.target, target ) :
								state === target )
									&&
							( !definition.origin || state.match( definition.origin, origin ) ) &&
						( result = definition ) );
					});
				}
				return result;
			}
			
			// Search order:
			return (
				// 1. `target`
				search( target ) ||

				// 2. `origin`
				origin !== target && search( origin ) ||

				// 3. superstates of `target`
				search( target.superstate(), this.defaultState() ) ||
					search( this.defaultState() ) ||
				
				// 4. superstates of `origin`
				!target.isIn( origin ) && search( origin.superstate(), origin.common( target ) ) ||

				new TransitionDefinition
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
	});

	return StateController;
})();

var StateEvent = ( function () {
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
	
	return StateEvent;
})();

var StateEventCollection = ( function () {
	var guid = 0;

	function StateEventCollection ( state, type ) {
		this.state = state;
		this.type = type;
		this.items = {};
		this.length = 0;
	}

	Z.extend( StateEventCollection.prototype, {
		guid: function () {
			return ( ++guid ).toString();
		},
		get: function ( id ) {
			return this.items[id];
		},
		key: function ( listener ) {
			var i, items = this.items;
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				if ( items[i] === listener ) return i;
			}
		},
		keys: function () {
			var i, items = this.items, result = [];
			result.toString = function () { return '[' + result.join() + ']'; };
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				result.push( items[i] );
			}
			return result;
		},
		add: function ( fn ) {
			var id = this.guid();
			this.items[id] = fn;
			this.length++;
			return id;
		},
		remove: function ( id ) {
			var items = this.items, fn = items[id];
			if ( fn ) {
				delete items[id];
				this.length--;
				return fn;
			}
			return false;
		},
		empty: function () {
			var i, items = this.items;
			if ( this.length ) {
				for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
					delete items[i];
				}
				this.length = 0;
				return true;
			} else {
				return false;
			}
		},
		emit: function ( data ) {
			var i, items = this.items, state = this.state, type = this.type;
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				items[i].apply( state, [ Z.extend( new StateEvent( state, type ), data ) ] );
			}
		}
	});
	Z.alias( StateEventCollection.prototype, {
		add: 'on',
		emit: 'trigger'
	});

	return StateEventCollection;
})();


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


var Transition = ( function () {
	Z.inherit( Transition, State );

	function Transition ( target, source, definition, callback ) {
		if ( !( this instanceof Transition ) ) {
			return TransitionDefinition.apply( this, arguments );
		}
		
		var	self = this,
			methods = {},
			events = Z.assign( TRANSITION_EVENT_TYPES, null ),
			guards = {},
			action = definition.action,
			attachment = source,
		 	controller, aborted;
		
		controller = source.controller();
		if ( controller !== target.controller() ) {
			controller = undefined;
		}

		// expose these in debug mode
		Z.env.debug && Z.assign( this.__private__ = {}, {
			methods: methods,
			events: events,
			guards: guards,
			action: action
		});

		Z.assign( this, {
			/**
			 * `superstate` is used here to track the transition's position as it walks the State
			 * subtree domain.
			 */
			superstate: function () { return attachment; },
			attachTo: function ( state ) { return attachment = state; },
			controller: function () { return controller; },
			origin: function () {
				return source instanceof Transition ? source.origin() : source;
			},
			source: function () { return source; },
			target: function () { return target; },
			setCallback: function ( fn ) { return callback = fn; },
			aborted: function () { return aborted; },
			
			/** */
			start: function () {
				var self = this;
				aborted = false;
				this.emit( 'start' );
				if ( Z.isFunction( action ) ) {
					action.apply( this, arguments );
				} else {
					return this.end();
				}
			},
			
			/** */
			abort: function () {
				aborted = true;
				callback = null;
				this.emit( 'abort' );
				return this;
			},
			
			/** */
			end: function ( delay ) {
				if ( delay ) {
					return setTimeout( function () { self.end(); }, delay );
				}
				if ( !aborted ) {
					this.emit( 'end' );
					callback && callback.apply( controller );
				}
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			
			/** */
			destroy: function () {
				source instanceof Transition && source.destroy();
				target = attachment = controller = null;
			}
		});

		Z.privilege( this, State.privileged, {
			'init' : [ TransitionDefinition ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event addEvent removeEvent emit' : [ events ],
		});

		Z.alias( this, { addEvent: 'on', emit: 'trigger' } );
		
		this.init( definition );
		definition = null;
	}

	Transition.prototype.depth = function () {
		var count = 0, transition = this, source;
		while ( ( source = transition.source() ) instanceof Transition ) {
			transition = source;
			count++;
		}
		return count;
	};
	
	return Transition;
})();

var TransitionDefinition = ( function () {
	var	properties = Z.assign( TRANSITION_PROPERTIES, null ),
		categories = Z.assign( TRANSITION_DEFINITION_CATEGORIES, null );
		eventTypes = Z.assign( TRANSITION_EVENT_TYPES );
	
	function TransitionDefinition ( map ) {
		if ( !( this instanceof TransitionDefinition ) ) {
			return new TransitionDefinition( map );
		}
		Z.extend( true, this, map instanceof TransitionDefinition ? map : interpret( map ) );
	}

	function interpret ( map ) {
		var	result = Z.extend( {}, properties, categories ),
			key, value, category, events;
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			if ( key in properties ) {
				result[ key ] = value;
			}
			else if ( key in categories ) {
				Z.extend( result[ key ], value );
			}
			else {
				category = key in eventTypes ? 'events' : 'methods';
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
		}
		for ( key in ( events = result.events ) ) {
			Z.isFunction( value = events[ key ] ) && ( events[ key ] = [ value ] );
		}

		return result;
	}

	return TransitionDefinition;
})();


Z.assign( state, {
	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	StateProxy: StateProxy,
	Transition: Transition,
	TransitionDefinition: TransitionDefinition
});

})();

