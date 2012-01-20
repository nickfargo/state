function StateController ( owner, name, definition, options ) {
	if ( !( this instanceof StateController ) ) {
		return new StateController( owner, name, definition, options );
	}
	
	var	self = this,
		privileged = StateController.privileged,
		args = overload( arguments, this.constructor.overloads ),
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

	// Rewrites for overloaded arguments
	owner = args.owner || {};
	name = args.name || 'state';
	definition = args.definition instanceof StateDefinition ?
		args.definition :
		StateDefinition( args.definition );
	typeof ( options = args.options || {} ) === 'string' && ( options = { initialState: options } );
	
	owner[ name ] = accessor;

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
	
	Z.privilege( this, StateController.privileged, {
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
						( target = this.createProxy( target ) );
					
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
							this.destroyProxy( origin );
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
				new TransitionDefinition()
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
