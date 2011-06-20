State.Controller = extend( true,
	function StateController ( owner, name, definition, options ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, definition, options );
		}
		
		var	defaultState, currentState, transition, getName,
			self = this,
			privileged = State.Controller.privileged,
			args = mapOverloads( arguments, this.constructor.overloads );
		
		function getName () { return name; }
		function setCurrentState ( value ) { return currentState = value; }
		function setTransition ( value ) { return transition = value; }
		
		// Rewrites for overloaded arguments
		( owner = args.owner || {} )[ name = args.name || 'state' ] = this;
		definition = args.definition instanceof State.Definition ? args.definition : State.Definition( args.definition );
		typeof ( options = args.options || {} ) === 'string' && ( options = { initialState: options } );
		
		// Expose these in debug mode
		debug && extend( this.__private__ = {}, {
			defaultState: defaultState,
			owner: owner,
			options: options
		});
		
		extend( this, {
			owner: function () { return owner; },
			name: getName.toString = getName,
			defaultState: function () { return defaultState; },
			current: extend( function () { return currentState; }, {
				toString: function () { return currentState.toString(); }
			}),
			transition: extend( function () { return transition; }, {
				toString: function () { return transition ? transition.toString() : ''; }
			})
		});
		
		indirect( this, State.Controller.privileged, {
			'change' : [ setCurrentState, setTransition ]
		});
		
		// Instantiate the default state and initialize it as the root of the state hierarchy
		( defaultState = extend( new State(), {
			controller: function () { return self; }
		}) ).init( definition );
		
		currentState = options.initialState ? defaultState.match( options.initialState ) : defaultState;
		currentState.controller() === this || ( currentState = this.createProxy( currentState ) );
	}, {
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
			 * of appropriate events, and construction of temporary protostate proxies as necessary. Adheres
			 * to rules supplied in both the origin and destination states, and fails appropriately if a
			 * matching rule disallows the change.
			 * 
			 * @param destination:State
			 * @param options:Object Map of settings:
			 * 		forced:Boolean
			 * 			Overrides any rules defined, ensuring the change will complete, assuming a valid
			 * 			destination.
			 * 		success:Function
			 * 			Callback to be executed upon successful completion of the change.
			 * 		failure:Function
			 * 			Callback to be executed if the change is blocked by a rule.
			 * @param setCurrentState:Function
			 * @param setTransition:Function
			 * 
			 * @see State.Controller.change
			 */
			change: function ( setCurrentState, setTransition ) {
				return function ( destination, options ) {
					var	destinationOwner, source, origin, domain, info, state,
						owner = this.owner(),
						transition = this.transition(),
						transitionDefinition,
						self = this;
				
					// Translate `destination` argument to a proper `State` object if necessary.
					destination instanceof State || ( destination = destination ? this.get( destination ) : this.defaultState() );
				
					if ( !destination ||
							( destinationOwner = destination.owner() ) !== owner &&
							!destinationOwner.isPrototypeOf( owner )
					) {
						throw new Error( "StateController: attempted a change to an invalid state" );
					}
				
					options || ( options = {} );
					origin = transition ? transition.origin() : this.current();
					if ( options.forced ||
							origin.evaluateRule( 'release', destination ) &&
							destination.evaluateRule( 'admit', origin )
					) {
						/*
						 * If `destination` is a state from a prototype of `owner`, it must be represented here as a
						 * transient protostate proxy.
						 */
						destination && destination.controller() !== this && ( destination = this.createProxy( destination ) );
						
						// If a transition is underway, it needs to be notified that it won't finish.
						transition && transition.abort();
						
						source = state = this.current();
						domain = source.common( destination );
						
						/*
						 * Retrieve the appropriate transition definition for this origin/destination pairing;
						 * if none is defined then a default transition is created that will cause the callback
						 * to return immediately.
						 */
						transition = setTransition( new State.Transition(
							destination,
							source,
							transitionDefinition = this.getTransitionDefinitionFor( destination, origin )
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
							 * Trace a path from `destination` up to `domain`, then walk down it, capturing 'enter'
							 * events along the way, and terminating with an 'arrive' event.
							 */
							for ( state = destination; state !== domain; pathToState.push( state ), state = state.superstate() );
							while ( pathToState.length ) {
								transition.attachTo( state = pathToState.pop() );
								state.trigger( 'enter', info );
							}
							transition.trigger( 'exit' );
							setCurrentState( destination );
							this.current().trigger( 'arrive', info );
							
							origin instanceof State.Proxy && ( this.destroyProxy( origin ), origin = null );
							transition.destroy(), transition = setTransition( null );
							
							typeof options.success === 'function' && options.success.call( this );
							return this;
						});
						
						transition.start.apply( transition, options.arguments );
						return this;
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
						state = new State.Proxy( state, name );
						name = derivation.shift();
					}
					return state;
				}
			},
			
			/**
			 * Destroys `proxy` and all of its StateProxy superstates.
			 */
			destroyProxy: function ( proxy ) { //// untested
				var superstate;
				while ( proxy instanceof State.Proxy ) {
					superstate = proxy.superstate();
					proxy.destroy();
					proxy = superstate;
				}
			},
			
			/**
			 * Finds the appropriate transition definition for the given origin and destination states. If no
			 * matching transitions are defined in any of the states, returns a generic transition definition
			 * for the origin/destination pair with no `operation`.
			 */
			getTransitionDefinitionFor: function ( destination, origin ) { //// untested
				origin || ( origin = this.current() );
				
				function search ( state, until ) {
					var result;
					for ( ; state && state !== until; state = until ? state.superstate() : undefined ) {
						each( state.transitions(), function ( i, definition ) {
							return !(
								( definition.destination ? state.match( definition.destination, destination ) : state === destination ) &&
								( !definition.origin || state.match( definition.origin, origin ) ) &&
							( result = definition ) );
						});
					}
					return result;
				}
				
				// Search order: (1) `destination`, (2) `origin`, (3) superstates of `destination`, (4) superstates of `origin`
				return (
					search( destination ) ||
					origin !== destination && search( origin ) ||
					search( destination.superstate(), this.defaultState() ) || search( this.defaultState() ) ||
					!destination.isIn( origin ) && search( origin.superstate(), origin.common( destination ) ) ||
					new State.Transition.Definition()
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
	}
);
