( function ( undefined ) {

var	global = this,
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z,

	// ### State attributes
	STATE_ATTRIBUTES = {
		NORMAL      : 0x0,

		// A **virtual state** is a lightweight inheritor of a **protostate** located higher in the
		// owner object's prototype chain.
		VIRTUAL     : 0x1,

		// Marking a state `initial` specifies which state a newly instantiated `StateController`
		// should assume.
		INITIAL     : 0x2,

		// Once a state marked `final` is entered, no further outbound transitions are allowed.
		FINAL       : 0x4,

		// An **abstract state** cannot be assumed directly. A transition target that points to a
		// state marked `abstract` is interpreted in terms of one (or more) of its substates.
		ABSTRACT    : 0x8,

		// Marking a state `default` designates it as the actual target for any transition that
		// targets its abstract superstate.
		DEFAULT     : 0x10,

		// A state marked `sealed` cannot have substates.
		SEALED      : 0x20,

		// In a state marked `regioned`, any substates are considered **concurrent orthogonal
		// regions**. Upon entering a regioned state, the controller creates a new set of
		// subcontrollers, one for each region, which will exist as long as the regioned state
		// remains active. Method calls are forwarded to at most one of the regions, while event
		// emissions are propagated to all of the regions. *(Not presently implemented.)*
		REGIONED    : 0x40
	},

	// 
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

// ## state()
// 
// The module is exported as a function that can be used either to return a `StateDefinition`, or
// to apply a new state implementation to an arbitrary owner.
// 
// ##### StateDefinition state( [String modifiers,] Object definition )
// 
// If supplied with only one object-typed argument, a `StateDefinition` based on the contents of
// `definition` is returned. *See [`StateDefinition`](#state-definition)*
// 
// ##### State state( [String modifiers,] Object owner, [String name,] Object definition [, Object|String options] )
// 
// With two object-typed arguments, the second of the two similarly specifies a `StateDefinition`,
// while the first object specifies an `owner` object to which a new state implementation created
// from that definition will be applied. The function returns the owner's initial `State`.

function state ( attributes, owner, name, definition, options ) {
	typeof attributes === 'string' || ( options = definition, definition = name, name = owner,
		owner = attributes, attributes = null );
	if ( name === undefined && definition === undefined && options === undefined ) {
		return new StateDefinition( attributes, definition = owner )
	}

	typeof name === 'string' || ( options = definition, definition = name, name = null );
	return ( new StateController( owner, name || 'state',
		new StateDefinition( attributes, definition ), options ) ).current();
}

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

Z.assign( state, {
	VERSION: '0.0.2',

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});

// <a id="state" />

// ## State
// 
// States model behavior on behalf of an owner object. Methods of the owner are redirected to
// their appropriate stateful implementation given the owner's current state, such that, as the
// owner changes from one state to another, it exhibits a different behavior in each state.
// 
// States can be nested hierarchically in a tree structure, with **substates** inheriting their
// behavior from their **superstate**. In addition, a state also observes the owner object's
// prototypal inheritance, identifying an identically named and positioned state in the prototype
// as its **protostate**, from which it immediately inherits all behavior defined within.

var State = ( function () {
	Z.assign( State, STATE_ATTRIBUTES );

	// ### Constructor
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			return new State( superstate, name, definition );
		}
		
		var attributes = definition && definition.attributes || STATE_ATTRIBUTES.NORMAL;
		
		// #### attributes
		// 
		// Returns the bit field of this state's attributes.
		this.attributes = function () { return attributes; };

		// #### name
		// 
		// Returns the local name of this state.
		this.name = Z.stringFunction( function () { return name || ''; } );

		// Do the minimal setup required for a virtual state.
		if ( attributes & STATE_ATTRIBUTES.VIRTUAL ) {
			this.superstate = State.privileged.superstate( superstate );

			// #### reify
			// 
			// Virtual states are weakly bound to a state hierarchy by their reference held at
			// `superstate`; they are not proper members of the superstate's set of substates. The
			// `reify` method allows a virtual state to transform itself at some later time into a
			// "real" state, with its own set of closed properties and methods, existing thereafter
			// as an abiding member of its superstate's set of substates.
			this.reify = function ( definition ) {
				delete this.reify;
				attributes &= ~STATE_ATTRIBUTES.VIRTUAL;

				superstate.addSubstate( name, this ) &&
					reify.call( this, superstate, attributes, definition );
				
				return this;
			};
		}

		// Do the full setup required for a real state.
		else {
			reify.call( this, superstate, attributes, definition );
		}
	}

	// ### Static functions

	// #### reify
	// 
	// The reification procedure is offloaded from the constructor, allowing for construction of
	// virtual `State` instances that inherit all of their functionality from protostates.
	function reify ( superstate, attributes, definition ) {
		var	data = {},
			methods = {},
			events = {},
			guards = {},
			substates = {},
			transitions = {};
		
		// (Exposed for debugging.)
		Z.env.debug && Z.assign( this.__private__ = {}, {
			attributes: attributes,
			data: data,
			methods: methods,
			events: events,
			guards: guards,
			substates: substates,
			transitions: transitions
		});
		
		function setSuperstate ( value ) { return superstate = value; }
		
		// Method names are mapped to specific local variables. The named methods are created on
		// `this`, each of which is a partial application of its corresponding method factory at
		// `State.privileged`.
		Z.privilege( this, State.privileged, {
			'init' : [ StateDefinition ],
			'superstate' : [ superstate ],
			'data' : [ data ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event addEvent removeEvent emit' : [ events ],
			'guard addGuard removeGuard' : [ guards ],
			'substate substates addSubstate removeSubstate' : [ substates ],
			'transition transitions addTransition' : [ transitions ],
			'destroy' : [ setSuperstate, methods, events, substates ]
		});
		Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );

		// If no superstate is given, e.g. for a root state being created by a `StateController`,
		// then `init()` must be called later by the implementor.
		superstate && this.init( definition );

		return this;
	}

	// #### createDelegator
	// 
	// Forwards a `methodName` call to `controller`, which will then forward the call on to
	// the appropriate implementation in the state hierarchy as determined by the
	// controller's current state.
	// 
	// The context of autochthonous methods relocated to the root state remains bound to
	// the owner, whereas stateful methods are executed in the context of the state in
	// which they are declared, or if the implementation resides in a protostate, the
	// context will be the corresponding virtual state within `controller`.
	// 
	// *See also:* `State.privileged.addMethod`
	function createDelegator ( controllerName, methodName, original ) {
		function delegator () {
			return this[ controllerName ]().apply( methodName, arguments );
		}
		
		delegator.isDelegator = true;
		original && ( delegator.original = original );

		return delegator;
	}

	// ### Privileged methods
	// 
	// Methods defined here are partially applied from within a constructor.
	State.privileged = {

		// #### init
		// 
		// Builds out the state's members based on the contents of the supplied definition.
		init: function ( /*Function*/ definitionConstructor ) {
			return function ( /*<definitionConstructor> | Object*/ definition ) {
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
		
				this.emit( 'construct', { definition: definition }, false );
		
				return this;
			};
		},

		// #### superstate
		// 
		// Returns the immediate superstate, or the nearest state in the superstate chain with
		// the provided `stateName`.
		superstate: function ( /*State*/ superstate ) {
			return function (
				/*String*/ stateName // optional
			) {
				return stateName === undefined ?
					superstate
					:
					superstate ?
						stateName ?
							superstate.name() === stateName ?
								superstate : superstate.superstate( stateName )
							:
							this.controller().root()
						:
						undefined;
			}
		},

		// #### data
		// 
		// Either gets or sets a block of data associated with this state.
		// 
		// ##### ( [Boolean viaSuper], [Boolean viaProto] )
		// 
		// Gets data attached to this state, including all data from inherited states,
		// unless specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
		// 
		// ##### ( Object edit, [Boolean isDeletion] )
		// 
		// Sets data on this state, overwriting any existing items, or if `!!isDeletion`
		// is `true`, deletes from `data` the items with matching keys in `edit` whose values
		// evaluate to `true`. If the operation causes `data` to be changed, a `mutate` event
		// is generated for this state.
		data: function ( /*Object*/ data ) {
			return function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				var viaSuper, viaProto, key, superstate, protostate;

				if ( typeof edit === 'boolean' ) {
					viaSuper = edit, viaProto = isDeletion, edit = false;
				}

				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				if ( edit ) {
					if ( this.isVirtual() ) {
						return this.reify().data( edit, isDeletion );
					}

					if ( isDeletion ?
						!Z.isEmpty( data ) && !Z.isEmpty( edit ) && Z.excise( true, data, edit )
						:
						Z.isEmpty( edit ) || Z.extend( true, data, edit )
					) {
						this.emit( 'mutate', { edit: edit, isDeletion: isDeletion }, false );
					}
					return this;
				}

				else {
					return Z.extend( true, {},
						viaSuper && ( superstate = this.superstate() ) &&
							superstate.data(),
						viaProto && ( protostate = this.protostate() ) &&
							protostate.data( false ),
						data
					);
				}
			}
		},

		// #### method
		// 
		// Retrieves the named method held on this state. If no method is found, step through
		// this state's protostate chain to find one. If no method is found there, step up the
		// superstate hierarchy and repeat the search.
		method: function ( methods ) {
			return function (
				 /*String*/ methodName,
				/*Boolean*/ viaSuper,    // = true
				/*Boolean*/ viaProto     // = true
			) {
				var	superstate, protostate, method;

				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				methods && ( method = methods[ methodName ] );
				
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

		// #### methodAndContext
		// 
		// Returns an object containing both the product of `method()` and its associated context,
		// i.e. the `State` that will be referenced by `this` within the function.
		methodAndContext: function ( methods ) {
			return function (
				 /*String*/ methodName,
				/*Boolean*/ viaSuper,    // = true
				/*Boolean*/ viaProto     // = true
			) {
				var	superstate, protostate, method, result;
		
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
		
				methods && ( method = methods[ methodName ] );

				return (
					method && method !== Z.noop && { method: method, context: this }
						||
					viaProto && ( protostate = this.protostate() ) &&
							( method = protostate.method( methodName, false, true ) ) &&
							{ method: method, context: this }
						||
					viaSuper && ( superstate = this.superstate() ) && ( result =
							superstate.methodAndContext( methodName, true, viaProto ) ).method &&
							result
						||
					{ method: method, context: null }
				);
			};
		},

		// #### methodNames
		// 
		// Returns an `Array` of names of methods defined for this state.
		methodNames: function ( methods ) {
			return function () {
				return Z.keys( methods );
			};
		},

		// #### addMethod
		// 
		// Adds a method to this state, which will be callable directly from the owner, but with
		// its context bound to the state.
		addMethod: function ( methods ) {
			return function ( /*String*/ methodName, /*Function*/ fn ) {
				var	controller = this.controller(),
					controllerName = controller.name(),
					root = controller.root(),
					owner = controller.owner(),
					ownerMethod;

				if ( this.isVirtual() ) {
					return this.reify().addMethod( methodName, fn );
				}

				// If there is not already a method called `methodName` in the state hierarchy,
				// then the owner and controller need to be set up properly to accommodate calls
				// to this method.
				if ( !this.method( methodName, true, false ) ) {
					if ( this !== root && !root.method( methodName, false, false ) ) {
						ownerMethod = owner[ methodName ];
						if ( ownerMethod === undefined || ownerMethod.isDelegator ) {
							ownerMethod = Z.noop;
						}
						root.addMethod( methodName, ownerMethod );
					}

					// A delegator function is instated on the owner, which will direct subsequent
					// calls to `owner[ methodName ]` to the controller, and then on to the
					// appropriate state's implementation.
					owner[ methodName ] =
						createDelegator( controllerName, methodName, ownerMethod );
				}

				return methods[ methodName ] = fn;
			};
		},

		// #### removeMethod
		// 
		// Dissociates the named method from this state object and returns its function.
		removeMethod: function ( methods ) {
			return function ( /*String*/ methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			};
		},

		// #### event
		// 
		// Gets a registered event handler.
		event: function ( events ) {
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].get( id );
			};
		},

		// #### addEvent
		// 
		// Binds an event handler to the specified `eventType` and returns a unique identifier
		// for the handler. Recognized event types are listed at `StateEvent.types`.
		// 
		// *Aliases:* **on**, **bind**
		addEvent: function ( events ) {
			return function (
				  /*String*/ eventType,
				/*Function*/ fn,
				  /*Object*/ context    // = this
			) {
				if ( this.isVirtual() ) {
					return this.reify().addEvent( eventType, fn );
				}

				Z.hasOwn.call( events, eventType ) ||
					( events[ eventType ] = new StateEventCollection( this, eventType ) );
				
				return events[ eventType ].add( fn, context );
			};
		},

		// #### removeEvent
		// 
		// Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
		// 
		// *Aliases:* **off**, **unbind**
		removeEvent: function ( events ) {
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].remove( id );
			};
		},

		// #### emit
		// 
		// Invokes all bound handlers for the given event type.
		// 
		// *Alias:* **trigger**
		emit: function ( events ) {
			return function (
				 /*String*/ eventType,
				  /*Array*/ args,      // = []
				  /*State*/ context,   // = this
				/*Boolean*/ viaSuper,  // = true
				/*Boolean*/ viaProto   // = true
			) {
				var e, protostate, superstate;

				if ( typeof eventType !== 'string' ) {
					return;
				}
				typeof args === 'boolean' &&
					( viaProto = viaSuper, viaSuper = context, context = args, args = undefined );
				typeof context === 'boolean' &&
					( viaProto = viaSuper, viaSuper = context, context = undefined );

				e = events[ eventType ];
				!args && ( args = [] ) || Z.isArray( args ) || ( args = [ args ] );
				context || ( context = this );
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );

				e && e.emit( args, context );

				viaProto && ( protostate = this.protostate() ) &&
					protostate.emit( eventType, args, protostate, false );

				viaSuper && ( superstate = this.superstate() ) &&
					superstate.emit( eventType, args, superstate );
			};
		},

		// #### guard
		// 
		// Gets a **guard** entity for this state. A guard is a value or function that will be
		// evaluated, as either a boolean or predicate, respectively, to provide a determination
		// of whether a controller will be admitted into or released from the state to which the
		// guard is applied. Guards are inherited from protostates, but not from superstates.
		guard: function ( guards ) {
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

		// #### addGuard
		// 
		// Adds a guard to the state.
		addGuard: function ( guards ) {
			return function ( /*String*/ guardType, guard ) {
				if ( this.isVirtual() ) {
					return this.reify().addGuard( guardType, guard );
				}

				return guards[ guardType ] = guard;
			};
		},

		// #### removeGuard
		// 
		// Removes a guard. *(Not presently implemented.)*
		removeGuard: function ( guards ) {
			return function ( /*String*/ guardType, /*String*/ guardKey ) {
				throw new Error( "Not implemented" );
			};
		},

		// #### substate
		// 
		// Retrieves the named substate of `this` state. If no such substate exists in the local
		// state, any identically named substate held on a protostate will be returned.
		substate: function ( substates ) {
			return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
				var	s = this.controller().current(),
					ss, protostate;
				
				viaProto === undefined && ( viaProto = true );

				// First scan for any virtual substates that are current on the local controller.
				for ( ; s && s.isVirtual() && ( ss = s.superstate() ); s = ss ) {
					if ( ss === this && s.name() === stateName ) return s; 
				}

				// Otherwise retrieve a real substate, either locally or from a protostate.
				return (
					substates && substates[ stateName ]
						||
					viaProto && ( protostate = this.protostate() ) &&
							protostate.substate( stateName )
						||
					undefined
				);
			};
		},

		// #### substates
		// 
		// Returns an `Array` of this state's substates.
		substates: function ( substates ) {
			return function ( /*Boolean*/ deep ) {
				var	result = [],
					key;
				
				for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
					result.push( substates[ key ] );
					deep && ( result = result.concat( substates[ key ].substates( true ) ) );
				}

				return result;
			};
		},

		// #### addSubstate
		// 
		// Creates a state from the supplied `stateDefinition` and adds it as a substate of
		// this state. If a substate with the same `stateName` already exists, it is first
		// destroyed and then replaced. If the new substate is being added to the controller's
		// root state, a reference is added directly on the controller itself as well.
		addSubstate: function ( substates ) {
			return function (
				/*String*/ stateName,
				/*StateDefinition | Object | State*/ stateDefinition
			) {
				var substate, controller;
				
				if ( this.isVirtual() ) {
					return this.reify().addSubstate( stateName, stateDefinition );
				}
				if ( this.isSealed() ) {
					throw new Error;
				}

				( substate = substates[ stateName ] ) && substate.destroy();
				
				substate = stateDefinition instanceof State ?
					stateDefinition.superstate() === this && stateDefinition.reify() :
					new State( this, stateName, stateDefinition );
				
				if ( !substate ) return;
				
				this[ stateName ] = substates[ stateName ] = substate;
				
				controller = this.controller();
				controller.root() === this && ( controller[ stateName ] = substate );
				
				return substate;
			};
		},

		// #### removeSubstate
		// 
		// Removes the named substate from the local state, if possible.
		removeSubstate: function ( substates ) {
			return function ( /*String*/ stateName ) {
				var	controller, current, transition,
					substate = substates[ stateName ];

				if ( !substate ) return;

				controller = this.controller();
				current = controller.current();

				// If a transition is underway involving `substate`, the removal will fail.
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

				// The controller must be forced to evacuate the state before it is removed.
				current.isIn( substate ) && controller.change( this, { forced: true } );

				delete substates[ stateName ];
				delete this[ stateName ];
				controller.root() === this && delete controller[ stateName ];

				return substate;
			};
		},

		// #### transition
		// 
		// Returns the named transition definition held on this state.
		transition: function ( transitions ) {
			return function ( /*String*/ transitionName ) {
				return transitions[ transitionName ];
			};
		},

		// #### transitions
		// 
		// Returns an object containing all the transition definitions held on this state.
		transitions: function ( transitions ) {
			return function () {
				return Z.extend( true, {}, transitions );
			};
		},

		// #### addTransition
		// 
		// Registers a transition definition to this state.
		addTransition: function ( transitions ) {
			return function (
				/*String*/ transitionName,
				/*TransitionDefinition | Object*/ transitionDefinition
			) {
				if ( this.isVirtual() ) {
					return this.reify().addTransition( transitionName, transitionDefinition );
				}

				transitionDefinition instanceof TransitionDefinition ||
					( transitionDefinition = TransitionDefinition( transitionDefinition ) );
				
				return transitions[ transitionName ] = transitionDefinition;
			};
		},

		// #### destroy
		// 
		// Attempts to cleanly destroy this state and all of its substates. A `destroy` event is
		// issued to each state after it is destroyed.
		destroy: function ( setSuperstate, methods, events, substates ) {
			return function () {
				var	superstate = this.superstate(),
					controller = this.controller(),
					owner = controller.owner(),
					transition = controller.transition(),
					origin, target, key, methodName, delegator, method, stateName;
		
				// If a transition is underway that involves this state, then the state cannot be
				// destroyed.
				if ( transition ) {
					origin = transition.origin(), target = transition.target();

					if ( this === origin || this.isSuperstateOf( origin )  ||
							this === target || this.isSuperstateOf( target ) ) {
						return false;
					}
				}

				// Emit a `destroy` event on the local state.
				this.emit( 'destroy', false );
				for ( key in events ) {
					events[ key ].destroy();
					delete events[ key ];
				}

				if ( superstate ) {
					superstate.removeSubstate( this.name() );
				}
				// This is the root state, so restore any original methods to the owner and
				// delete any delegators.
				else {
					for ( methodName in methods ) {
						delegator = owner[ methodName ];
						method = delegator.original;
						if ( method ) {
							delete delegator.original;
							owner[ methodName ] = method;
						} else {
							delete owner[ methodName ];
						}
					}
				}
				for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
					substates[ stateName ].destroy();
				}
				setSuperstate( undefined );

				return true;
			};
		}
	};

	// ### Prototype methods
	// 
	// Entries for instance and privileged methods defined above are also included here as
	// defaults, so as to provide virtual states with a conformant `State` interface despite not
	// (yet) having been reified.
	Z.assign( State.prototype, {
		name: Z.thunk(''),
		attributes: Z.thunk( STATE_ATTRIBUTES.NORMAL ),
		isVirtual:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.VIRTUAL ); },
		isInitial:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.INITIAL ); },
		isDefault:   function () { return !!( this.attributes() & STATE_ATTRIBUTES.DEFAULT ); },
		isFinal:     function () { return !!( this.attributes() & STATE_ATTRIBUTES.FINAL ); },
		isAbstract:  function () { return !!( this.attributes() & STATE_ATTRIBUTES.ABSTRACT ); },
		isSealed:    function () { return !!( this.attributes() & STATE_ATTRIBUTES.SEALED ); },
		isRegioned:  function () { return !!( this.attributes() & STATE_ATTRIBUTES.REGIONED ); },

		'superstate \
		 removeMethod \
		 event removeEvent emit trigger \
		 guard removeGuard \
		 removeSubstate \
		 transition removeTransition' :
			Z.noop,
		
		'reify data': Z.getThis,
		'methodNames substates' : function () { return []; },
		transitions : function () { return {}; },
		destroy: Z.thunk( false ),
	});
	Z.privilege( State.prototype, State.privileged, {
		'data \
		 method methodAndContext addMethod \
		 addEvent \
		 addGuard \
		 substate addSubstate \
		 addTransition' :
			[ null ]
	});
	Z.alias( State.prototype, { addEvent: 'on bind', removeEvent: 'off unbind' } );
	Z.assign( State.prototype, {

		// #### toString
		// 
		// Returns this state's fully qualified name.
		toString: function () {
			return this.derivation( true ).join('.');
		},
		
		// #### controller
		// 
		// Gets the `StateController` to which this state belongs.
		controller: function () {
			var superstate = this.superstate();
			if ( superstate ) {
				return superstate.controller();
			}
		},
		
		// #### owner
		// 
		// Gets the owner object to which this state's controller belongs.
		owner: function () {
			var controller = this.controller();
			if ( controller ) {
				return controller.owner();
			}
		},
		
		// #### root
		// 
		// Gets the root state, i.e. the top-level superstate of this state.
		root: function () {
			var controller = this.controller();
			if ( controller ) {
				return controller.root();
			}
		},
		
		// #### defaultSubstate
		// 
		// Returns the first substate marked `default`, or simply the first substate.
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

		// #### initialSubstate
		// 
		// Performs breadth-first traversal to locate the leftmost deepest state marked `initial`,
		// recursing into the protostate only if no local states are marked `initial`.
		initialSubstate: function (
			/*Boolean*/ viaProto // = true
		) {
			var	queue = [ this ],
				subject, substates, i, l, s, p;
			
			while ( subject = queue.shift() ) {
				substates = subject.substates();
				for ( i = 0, l = substates.length; i < l; i++ ) {
					s = substates[i];
					if ( s.isInitial() ) {
						return s.initialSubstate( false ) || s;
					}
					queue.push( s );
				}
			}

			if ( ( viaProto || viaProto === undefined ) && ( p = this.protostate() ) ) {
				return p.initialSubstate( true );
			}
		},

		// #### protostate
		// 
		// Returns the **protostate**, the state analogous to `this` found in the next object in the
		// owner's prototype chain that has one. A state inherits from both its protostate and
		// superstate, *in that order*.
		// 
		// If the owner does not share an analogous `StateController` with its prototype, or if no
		// protostate can be found in the hierarchy of the prototype's state controller, then the
		// search is iterated up the prototype chain.
		// 
		// A state and its protostate will always share an identical name and identical derivation
		// pattern, as will the respective superstates of both, relative to one another.
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
						c.root() :
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

		// #### derivation
		// 
		// Returns an object array of this state's superstate chain, starting after the root
		// state and ending at `this`. If `byName` is set to `true`, a string array of the
		// states' names is returned instead.
		derivation: function ( /*Boolean*/ byName ) {
			for ( var result = [], state, superstate = this;
					( state = superstate ) && ( superstate = state.superstate() );
					result.unshift( byName ? state.name() || '' : state ) );
			return result;
		},

		// #### depth
		// 
		// Returns the number of superstates this state has. The root state returns `0`, its
		// immediate substates return `1`, etc.
		depth: function () {
			for ( var count = 0, state = this, superstate;
					superstate = state.superstate();
					count++, state = superstate );
			return count;
		},

		// #### common
		// 
		// Returns the least common ancestor of `this` and `other`. If `this` is itself an ancestor
		// of `other`, or vice versa, that ancestor is returned.
		common: function ( /*State|String*/ other ) {
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
		
		// #### is
		// 
		// Determines whether `this` is `state`.
		is: function ( /*State|String*/ state ) {
			state instanceof State || ( state = this.match( state ) );
			return state === this;
		},

		// #### isIn
		// 
		// Determines whether `this` is or is a substate of `state`.
		isIn: function ( /*State|String*/ state ) {
			state instanceof State || ( state = this.match( state ) );
			return state === this || state.isSuperstateOf( this );
		},
		
		// #### isSuperstateOf
		// 
		// Determines whether `this` is a superstate of `state`.
		isSuperstateOf: function ( /*State|String*/ state ) {
			var superstate;
			state instanceof State || ( state = this.match( state ) );
			
			return ( superstate = state.superstate() ) ?
				this === superstate || this.isSuperstateOf( superstate )
				:
				false;
		},

		// #### isProtostateOf
		// 
		// Determines whether `this` is a state analogous to `state` on any object in the prototype
		// chain of `state`'s owner.
		isProtostateOf: function ( /*State|String*/ state ) {
			var protostate;
			state instanceof State || ( state = this.match( state ) );

			return ( protostate = state.protostate() ) ?
				this === protostate || this.isProtostateOf( protostate )
				:
				false;
		},

		// #### apply
		// 
		// Finds a state method and applies it in the appropriate context. If the method was
		// originally defined in the owner, the context will be the owner. Otherwise, the context
		// will either be the state in which the method is defined, or if the implementation
		// resides in a protostate, the corresponding virtual state in the calling controller.
		apply: function ( /*String*/ methodName, /*Array*/ args ) {
			var	mc = this.methodAndContext( methodName ),
				method = mc.method,
				owner, ownerMethod, context;
			
			if ( !method ) throw new TypeError( "State '" + this + "' cannot resolve method '" +
				methodName + "'" );

			owner = this.owner();
			ownerMethod = owner[ methodName ];
			context = mc.context;
			if ( ownerMethod && ownerMethod.original && context === this.root() ) {
				context = owner;
			}

			return method.apply( context, args );
		},
		
		// #### call
		// 
		// Like `apply`, with variadic arguments.
		call: function ( /*String*/ methodName ) {
			return this.apply( methodName, Z.slice.call( arguments, 1 ) );
		},
		
		// #### hasMethod
		// 
		// Determines whether `this` possesses or inherits a method named `methodName`.
		hasMethod: function ( /*String*/ methodName ) {
			var method = this.method( methodName );
			return method && method !== Z.noop;
		},
		
		// #### hasOwnMethod
		// 
		// Determines whether `this` directly possesses a method named `methodName`.
		hasOwnMethod: function ( /*String*/ methodName ) {
			return !!this.method( methodName, false, false );
		},

		// #### change
		// 
		// Forwards a `change` command to the state's controller and returns its result.
		// 
		// *Aliases:* **be**, **become**, **go**, **goTo**
		'change be become go goTo': function () {
			var controller = this.controller();
			return controller.change.apply( controller, arguments );
		},
		
		// #### select
		// 
		// Tells the controller to change to this or the specified `state` and returns the targeted
		// state.
		select: function ( /*State|String*/ state ) {
			state === undefined ?
				( state = this ) :
				state instanceof State || ( state = this.match( state ) );
			return this.controller().change( state ) && state;
		},

		// #### isSelected
		// 
		// Returns a `Boolean` indicating whether `this` is the controller's current state.
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

		// #### evaluateGuard
		// 
		// Returns the Boolean result of the guard function at `guardName` defined on this state, as
		// evaluated against `testState`, or `true` if no guard exists.
		evaluateGuard: function (
			/*String*/ guardName,
			 /*State*/ testState   // optional
		) {
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

		// #### match
		// 
		// Matches a string expression `expr` with the state or states it represents, evaluated in
		// the context of `this`.
		// 
		// Returns the matched state, the set of matched states, or a Boolean indicating whether
		// `testState` is included in the matched set.
		match: function (
			/*String*/ expr,
			 /*State*/ testState // optional
		) {
			var	parts = expr && expr.split('.'),
				cursor = parts && parts.length && parts[0] === '' ?
					( parts.shift(), this ) :
					this.root(),
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
		}
	});

	return State;
})();


// <a id="state-definition" />

// ## StateDefinition
// 
// A state **definition** is a formalization of a state's contents. States are usually declared
// using the exported `state()` function, and passing it a plain object map containing the
// definition. This may be expressed as a mixture of both convenient shorthand and disambiguating
// longform. The `StateDefinition` constructor then interprets and transforms such expressions into
// a consistent model that can be used to create `State` instances.

var StateDefinition = ( function () {
	var	categoryList   = Z.assign( STATE_DEFINITION_CATEGORIES ),
		eventTypes     = Z.assign( STATE_EVENT_TYPES ),
		guardActions   = Z.assign( GUARD_ACTIONS );

	// ### Constructor
	function StateDefinition (
		/*String | Object*/ attributes, // optional
		         /*Object*/ map
	) {
		if ( !( this instanceof StateDefinition ) ) {
			return new StateDefinition( attributes, map );
		}

		typeof attributes === 'string' ?
			map || ( map = {} ) :
			map || ( map = attributes, attributes = undefined );
		
		Z.extend( true, this, map instanceof StateDefinition ? map : interpret( map ) );

		attributes == null || Z.isNumber( attributes ) ||
			( attributes = encodeAttributes( attributes ) );
		this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
	}

	// ### Static functions

	// #### encodeAttributes
	// 
	// Transforms the provided set of attributes into a bit field integer.
	function encodeAttributes ( /*Object | String*/ attributes ) {
		var	key,
			result = STATE_ATTRIBUTES.NORMAL;
		
		typeof attributes === 'string' && ( attributes = Z.assign( attributes ) );

		for ( key in attributes ) if ( Z.hasOwn.call( attributes, key ) ) {
			if ( ( key = key.toUpperCase() ) in STATE_ATTRIBUTES ) {
				result |= STATE_ATTRIBUTES[ key ];
			}
		}
		
		return result;
	}

	// #### interpret
	// 
	// Transforms a plain object map into a well-formed `StateDefinition`, making the appropriate
	// inferences for any shorthand notation encountered.
	function interpret ( /*Object*/ map ) {
		var	key, value, category,
			result = Z.setAll( Z.extend( {}, categoryList ), null );
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			
			// Priority 1: Do a nominative type match for explicit definition instances.
			category =
				value instanceof StateDefinition && 'states' ||
				value instanceof TransitionDefinition && 'transitions';
			if ( category ) {
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
			
			// Priority 2: Recognize an explicitly named category object.
			else if ( key in result ) {
				result[ key ] = Z.extend( result[ key ], value );
			}
			
			// Priority 3: Use keys and value types to infer implicit categorization.
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


// <a id="state-controller" />

// ## StateController
// 
// A state **controller** is the mediator between an owner object and its implementation of state.
// The controller maintains the identity of the owner's active state, and facilitates transitions
// from one state to another. It provides the behavior-modeling aspect of the owner's state by
// forwarding method calls made on the owner to any associated stateful implementations of those
// methods that are valid given the current state.

var StateController = ( function () {

	// ### Constructor
	function StateController (
		                  /*Object*/ owner,      // = {}
		                  /*String*/ name,       // = 'state'
		/*StateDefinition | Object*/ definition, // optional
		                  /*Object*/ options     // optional
	) {
		if ( !( this instanceof StateController ) ) {
			return new StateController( owner, name, definition, options );
		}
		
		var	self = this,
			root, current, transition;
		
		function setCurrent ( value ) { return current = value; }
		function setTransition ( value ) { return transition = value; }
		
		// #### accessor
		// 
		// This function will be the owner object's interface to its implemented state.
		function accessor () {
			var current, controller, root, key, method;

			if ( this === owner ) {
				current = self.current();
				return arguments.length ? current.match.apply( current, arguments ) : current;
			}

			// Calling the accessor of a prototype means that `this` requires its own accessor
			// and `StateController`.
			else if (
				Object.prototype.isPrototypeOf.call( owner, this ) &&
				!Z.hasOwn( this, name )
			) {
				controller = new StateController( this, name, null, self.current().toString() );
				root = controller.root();

				// Any methods of `this` that have stateful implementations located higher in the
				// prototype chain must be copied into the root state to be used as defaults.
				for ( key in this ) if ( Z.hasOwn.call( this, key ) ) {
					method = this[ key ];
					if ( Z.isFunction( method ) && root.method( key, false ) ) {
						root.addMethod( key, method );
					}
				}

				return this[ name ].apply( this, arguments );
			}
		}

		// Validate arguments.
		owner || ( owner = {} );
		name || ( name = 'state' );
		definition instanceof StateDefinition ||
			( definition = new StateDefinition( definition ) );
		options === undefined && ( options = {} ) ||
			typeof options === 'string' && ( options = { initialState: options } );
		
		// Assign the accessor function to the owner.
		owner[ name ] = accessor;

		// (Exposed for debugging.)
		Z.env.debug && Z.assign( this.__private__ = {}, {
			root: root,
			owner: owner,
			options: options
		});
		
		// ### Internal privileged methods
		Z.assign( this, {
			// #### owner
			// 
			// Returns the owner object on whose behalf this controller acts.
			owner: function () { return owner; },

			// #### name
			// 
			// Returns the name assigned to this controller. This is also the key in `owner` that
			// holds the `accessor` function associated with this controller.
			name: Z.stringFunction( function () { return name; } ),

			// #### root
			// 
			// Returns the root state.
			root: function () { return root; },

			// #### current
			// 
			// Returns the controller's current state, or currently active transition.
			current: Z.assign( function () { return current; }, {
				toString: function () { return current ? current.toString() : undefined; }
			}),

			// #### transition
			// 
			// Returns the currently active transition, or `undefined` if the controller is not
			// presently engaged in a transition.
			transition: Z.assign( function () { return transition; }, {
				toString: function () { return transition ? transition.toString() : ''; }
			})
		});
		
		// Assign partially applied external privileged methods.
		Z.privilege( this, StateController.privileged, {
			'change' : [ setCurrent, setTransition ]
		});
		
		// Instantiate the root state, adding a redefinition of the `controller` method that points
		// directly to this controller, along with all of the members and substates outlined in
		// `definition`.
		root = Z.assign( new State, {
			controller: function () { return self; }
		});
		root.init( definition );
		
		// Establish which state should be the initial state and set the current state to that.
		current = root.initialSubstate() || root;
		options.initialState !== undefined && ( current = root.match( options.initialState ) );
		current.controller() === this || ( current = virtualize.call( this, current ) );
	}

	// ### Static functions

	// #### virtualize
	// 
	// Creates a transient virtual state within the local state hierarchy to represent
	// `protostate`, along with as many virtual superstates as are necessary to reach a real
	// `State` in the local hierarchy.
	function virtualize ( protostate ) {
		var	derivation, state, next, name;
		function iterate () {
			return next = state.substate( ( name = derivation.shift() ), false );
		}
		if ( protostate instanceof State &&
			protostate.owner().isPrototypeOf( this.owner() ) &&
			( derivation = protostate.derivation( true ) ).length
		) {
			for ( state = this.root(), iterate(); next; state = next, iterate() );
			while ( name ) {
				state = new State( state, name, { attributes: STATE_ATTRIBUTES.VIRTUAL } );
				name = derivation.shift();
			}
			return state;
		}
	}
	
	// #### annihilate
	// 
	// Destroys the given `virtualState` and all of its virtual superstates.
	function annihilate ( virtualState ) {
		var superstate;
		while ( virtualState.isVirtual() ) {
			superstate = virtualState.superstate();
			virtualState.destroy();
			virtualState = superstate;
		}
	}
	
	// ### External privileged methods

	StateController.privileged = {

		// #### change
		// 
		// Attempts to execute a state transition. Handles asynchronous transitions, generation of
		// appropriate events, and construction of any necessary temporary virtual states. Respects
		// guards supplied in both the origin and `target` states, and fails appropriately if a
		// matching guard disallows the change.
		// 
		// The `options` parameter is an optional map that includes:
		// 
		// * `forced` : `Boolean` — overrides any guards defined, ensuring the change will
		//   complete, assuming a valid target.
		// * `success` : `Function` — callback to be executed upon successful completion of the
		//   transition.
		// * `failure` : `Function` — callback to be executed if the transition attempt is blocked
		//   by a guard.
		change: function ( setCurrent, setTransition ) {
			return function (
				/*State | String*/ target,
				        /*Object*/ options // optional
			) {
				var	owner, transition, targetOwner, source, origin, domain, info, state,
					transitionDefinition,
					self = this;

				owner = this.owner();
				transition = this.transition();

				// The `origin` is defined as the most recent non-transition `State` assumed by
				// the controller.
				origin = transition ? transition.origin() : this.current();

				// Departures are not allowed from a state that is `final`.
				if ( origin.isFinal() ) {
					throw new Error;
				}

				// Resolve `target` argument to a proper `State` object if necessary.
				target instanceof State ||
					( target = target ? origin.match( target ) : this.root() );
			
				if ( !target ||
						( targetOwner = target.owner() ) !== owner &&
						!targetOwner.isPrototypeOf( owner )
				) {
					throw new Error( "StateController: attempted a change to an invalid state" );
				}

				// A transition cannot target an abstract state directly, so `target` will be
				// reassigned to the appropriate concrete substate.
				while ( target.isAbstract() ) {
					target = target.defaultSubstate();
					if ( !target ) {
						throw new Error;
					}
				}
				
				options || ( options = {} );

				// If any guards are in place for the given `origin` and `target` states, they must
				// consent to the transition, unless we specify that it should be `forced`.
				if ( !options.forced && (
						!origin.evaluateGuard( 'release', target ) ||
						!target.evaluateGuard( 'admit', origin )
				) ) {
					typeof options.failure === 'function' && options.failure.call( this );
					return false;
				}


				// If `target` is a state from a prototype of `owner`, it must be represented
				// here as a transient virtual state.
				target && target.controller() !== this &&
					( target = virtualize.call( this, target ) );
				
				// If a previously initiated transition is still underway, it needs to be
				// notified that it won't finish.
				transition && transition.abort();
				
				// The `source` will reference the previously current state (or abortive
				// transition).
				source = state = this.current();

				// The upcoming transition will start from its `source` and proceed within the
				// `domain` of the least common ancestor between that state and the specified
				// target.
				domain = source.common( target );
				
				// Retrieve the appropriate transition definition for this origin/target
				// pairing; if none is defined then a default transition is created that will
				// cause the callback to return immediately.
				transition = setTransition( new Transition(
					target,
					source,
					transitionDefinition = this.getTransitionDefinitionFor( target, origin )
				));
				info = { transition: transition, forced: !!options.forced };
				
				// Preparation for the transition begins by emitting a `depart` event on the
				// `source` state.
				source.emit( 'depart', info, false );

				// Enter into the transition state.
				setCurrent( transition );
				transition.emit( 'enter', false );
				
				// Walk up to the top of the domain, emitting `exit` events for each state
				// along the way.
				while ( state !== domain ) {
					state.emit( 'exit', info, false );
					transition.attachTo( state = state.superstate() );
				}
				
				// Provide an enclosed callback that will be called from `transition.end()` to
				// conclude the transition.
				transition.setCallback( function () {
					var pathToState = [];
					
					// Trace a path from `target` up to `domain`, then walk down it, emitting
					// 'enter' events for each state along the way.
					for ( state = target; state !== domain; state = state.superstate() ) {
						pathToState.push( state );
					}
					while ( pathToState.length ) {
						transition.attachTo( state = pathToState.pop() );
						state.emit( 'enter', info, false );
					}

					// Exit from the transition state.
					transition.emit( 'exit', false );
					setCurrent( target );

					// Terminate the transition with an `arrive` event on the targeted
					// state.
					target.emit( 'arrive', info, false );
					
					// Any virtual states that were previously current are no longer needed.
					if ( origin.isVirtual() ) {
						annihilate.call( this, origin );
						origin = null;
					}

					// Now complete, the `Transition` instance can be discarded.
					transition.destroy();
					transition = setTransition( null );
					
					typeof options.success === 'function' && options.success.call( this );

					return target;
				});
				
				// At this point the transition is attached to the `domain` state and is ready
				// to proceed.
				return transition.start.apply( transition, options.arguments ) || target;
			}
		}
	};
	
	// ### Prototype methods

	Z.assign( StateController.prototype, {

		// #### toString
		// 
		toString: function () {
			return this.current().toString();
		},

		// #### getTransitionDefinitionFor
		// 
		// Finds the appropriate transition definition for the given origin and target states. If
		// no matching transitions are defined in any of the states, returns a generic actionless
		// transition definition for the origin/target pair.
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
			// 1. `target`,
			// 2. `origin`,
			// 3. superstates of `target`,
			// 4. superstates of `origin`.
			return (
				search( target ) ||
				origin !== target && search( origin ) ||
				search( target.superstate(), this.root() ) ||
					search( this.root() ) ||
				!target.isIn( origin ) && search( origin.superstate(), origin.common( target ) ) ||
				new TransitionDefinition
			);
		},
		
		// #### destroy
		// 
		// Destroys this controller and all of its states, and returns the owner to its original
		// condition.
		destroy: function () {
			return this.root().destroy() && delete this.owner()[ this.name() ];
		}
	});

	return StateController;
})();

// <a id="state-event" />

// ## StateEvent
// 
// When an event is emitted from a state, it passes a `StateEvent` object to any bound listeners,
// containing the `type` string and a reference to the contextual `state`.

var StateEvent = ( function () {

	// ### Constructor
	function StateEvent ( state, type ) {
		Z.assign( this, {
			target: state,
			name: state.toString(),
			type: type
		});
	}

	StateEvent.prototype.toString = function () {
		return 'StateEvent (' + this.type + ') ' + this.name;
	};
	
	return StateEvent;
})();

// <a id="state-event-collection" />

// ## StateEventCollection
// 
// A state holds event listeners for each of its various event types in a `StateEventCollection`
// instance.

var StateEventCollection = ( function () {
	var guid = 0;

	// ### Constructor
	function StateEventCollection ( state, type ) {
		this.state = state;
		this.type = type;
		this.items = {};
		this.length = 0;
	}

	Z.assign( StateEventCollection.prototype, {
		// #### guid
		// 
		// Produces a unique numeric string, to be used as a key for bound event listeners.
		guid: function () {
			return ( ++guid ).toString();
		},

		// #### get
		// 
		// Retrieves a bound listener associated with the provided `id` string as returned by
		// the prior call to `add`.
		get: function ( id ) {
			return this.items[id];
		},

		// #### key
		// 
		// Retrieves the `id` string associated with the provided listener.
		key: function ( listener ) {
			var i, items = this.items;
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				if ( items[i] === listener ) return i;
			}
		},

		// #### keys
		// 
		// Returns the set of `id` strings associated with all bound listeners.
		keys: function () {
			var i, items = this.items, result = [];

			result.toString = function () { return '[' + result.join() + ']'; };
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				result.push( items[i] );
			}
			return result;
		},

		// #### add
		// 
		// Binds a listener, along with an optional context object, to be called when the
		// the collection `emit`s an event. Returns a unique key that can be used later to
		// `remove` the listener.
		// 
		// *Aliases:* **on bind**
		add: function (
			/*Function*/ fn,
			  /*Object*/ context  // optional
		) {
			var id = this.guid();
			this.items[id] = typeof context === 'object' ? [ fn, context ] : fn;
			this.length++;
			return id;
		},

		// #### remove
		// 
		// Unbinds a listener. Accepts either the numeric string returned by `add` or a reference
		// to the function itself.
		// 
		// *Aliases:* **off unbind**
		remove: function ( /*Function | String*/ id ) {
			var	fn, i, l,
				items = this.items;
			
			fn = items[ typeof id === 'function' ? this.key( id ) : id ];
			if ( !fn ) return false;
			delete items[id];
			this.length--;
			return fn;
		},

		// #### empty
		empty: function () {
			var i, items = this.items;

			if ( !this.length ) return false;

			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
			this.length = 0;
			return true;
		},

		// #### emit
		// 
		// Creates a `StateEvent` and begins propagation of it through all bound listeners.
		// 
		// *Alias:* **trigger**
		emit: function ( args, state ) {
			var	i, item, fn, context,
				items = this.items, type = this.type;
			
			state || ( state = this.state );

			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				item = items[i];
				
				if ( typeof item === 'function' ) {
					fn = item, context = state;
				} else if ( Z.isArray( item ) ) {
					fn = item[0], context = item[1];
				}

				args.unshift( new StateEvent( state, type ) );
				fn && fn.apply( context, args );
			}
		},

		// #### destroy
		destroy: function () {
			this.empty();
			delete this.state, delete this.type, delete this.items, delete this.length;
			return true;
		}
	});
	Z.alias( StateEventCollection.prototype, {
		add: 'on bind',
		remove: 'off unbind',
		emit: 'trigger'
	});

	return StateEventCollection;
})();


// ## Transition
// 
// A **transition** is a transient `State` adopted by a controller as it changes from one of its
// proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor* to its **origin** and
// **target** states. During this time it behaves much as if it were a substate of that domain
// state, inheriting method calls and propagating events in the familiar fashion.

var Transition = ( function () {
	Z.inherit( Transition, State );

	// ### Constructor
	function Transition ( target, source, definition, callback ) {
		if ( !( this instanceof Transition ) ) {
			return TransitionDefinition.apply( this, arguments );
		}
		
		var	self = this,
			methods = {},
			events = {},

			// The **action** of a transition is a function that will be called after the
			// transition has been `start`ed. This function, if provided, is responsible for
			// calling `end()` on the transition at some point in the future.
			action = definition.action,

			attachment = source,
		 	controller, aborted;
		
		controller = source.controller();
		if ( controller !== target.controller() ) {
			controller = undefined;
		}

		// (Exposed for debugging.)
		Z.env.debug && Z.assign( this.__private__ = {}, {
			methods: methods,
			events: events,
			action: action
		});

		Z.assign( this, {
			// #### superstate
			// 
			// In a transition, `superstate` is used to track its position as it traverses the
			// `State` subtree that defines its domain.
			superstate: function () { return attachment; },

			// #### attachTo
			attachTo: function ( state ) { return attachment = state; },

			// #### controller
			controller: function () { return controller; },

			// #### origin
			// 
			// A transition's **origin** is the controller's most recently active `State` that is
			// not itself a `Transition`.
			origin: function () {
				return source instanceof Transition ? source.origin() : source;
			},

			// #### source
			// 
			// A transition's **source** is the `State` or `Transition` that immediately preceded
			// `this`.
			source: function () { return source; },

			// #### target
			// 
			// The intended destination `State` for this transition. If a target is invalidated by
			// a controller that `change`s state again before this transition completes, then this
			// transition is aborted and the `change` call will create a new transition that is
			// `source`d from `this`.
			target: function () { return target; },

			// #### setCallback
			// 
			// Allows the callback function to be set or changed prior to the transition's
			// completion.
			setCallback: function ( fn ) { return callback = fn; },

			// #### aborted
			aborted: function () { return aborted; },
			
			// #### start
			// 
			// Starts the transition; if an `action` is defined, that function is responsible
			// for declaring an end to the transition by calling `end()`. Otherwise, the
			// transition is necessarily synchronous and is concluded immediately.
			start: function () {
				var self = this;
				aborted = false;
				this.emit( 'start', false );
				if ( Z.isFunction( action ) ) {
					action.apply( this, arguments );
				} else {
					return this.end();
				}
			},
			
			// #### abort
			// 
			// Indicates that a transition won't directly reach its target state; for example, if a
			// new transition is initiated while an asynchronous transition is already underway,
			// that previous transition is aborted. The previous transition is retained as the
			// `source` for the new transition.
			abort: function () {
				aborted = true;
				callback = null;
				this.emit( 'abort', false );
				return this;
			},
			
			// #### end
			// 
			// Indicates that a transition has completed and has reached its intended target. The
			// transition is subsequently retired, along with any preceding aborted transitions.
			end: function () {
				if ( !aborted ) {
					this.emit( 'end', false );
					callback && callback.apply( controller, arguments );
				}
				this.destroy();
				return target;
			},
			
			// #### destroy
			// 
			// Destroys this transition and clears its held references, and does the same for any
			// aborted `source` transitions that preceded it.
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
		Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );
		
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

// ## TransitionDefinition
// 
// A state may hold **transition definitions** that describe the transition that will take place
// between any two given **origin** and **target** states.

var TransitionDefinition = ( function () {
	var	properties = Z.assign( TRANSITION_PROPERTIES, null ),
		categories = Z.assign( TRANSITION_DEFINITION_CATEGORIES, null );
		eventTypes = Z.assign( TRANSITION_EVENT_TYPES );
	
	// ### Constructor
	function TransitionDefinition ( map ) {
		if ( !( this instanceof TransitionDefinition ) ) {
			return new TransitionDefinition( map );
		}
		Z.extend( true, this, map instanceof TransitionDefinition ? map : interpret( map ) );
	}

	// ### Static functions

	// #### interpret
	// 
	// Transforms a plain object map into a well-formed `TransitionDefinition`, making the
	// appropriate inferences for any shorthand notation encountered.
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


// Make the set of defined classes available as members of the exported module.
Z.assign( state, {
	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	Transition: Transition,
	TransitionDefinition: TransitionDefinition
});

})();

