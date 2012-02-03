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