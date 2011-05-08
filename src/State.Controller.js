State.Controller = $.extend( true,
	function StateController ( owner, name, definition, initialState ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, definition, initialState );
		}
		
		var	defaultState, currentState, transition, getName,
			self = this,
			args = Util.resolveOverloads( arguments, this.constructor.overloads );
		
		function setCurrentState ( value ) { return currentState = value; }
		function setTransition ( value ) { return transition = value; }
		
		owner = args.owner;
		name = args.name || 'state';
		definition = args.definition instanceof State.Definition ? args.definition : State.Definition( args.definition );
		initialState = args.initialState;
		
		$.extend( this, {
			owner: function () {
				return owner;
			},
			name: ( getName = function () { return name; } ).toString = getName,
			defaultState: function () {
				return defaultState;
			},
			currentState: function () {
				return currentState || defaultState;
			},
			transition: function () {
				return transition;
			},
			addState: function ( stateName, stateDefinition ) {
				return defaultState.addState( stateName, stateDefinition );
			},
			removeState: function ( stateName ) {
				throw new Error( "State.Controller.removeState not implemented yet" );
			},
			
			/**
			 * Forwards to prototype, with closures providing write access to private vars `currentState`
			 * and `transition`.
			 * 
			 * @see State.Controller.prototype.changeState
			 */
			changeState: function ( destination, options ) {
				return State.Controller.prototype.changeState.call( this, destination, options, setCurrentState, setTransition );
			}
		});
		
		// Provide aliases, for brevity, but only if controller is not implemented as its own owner.
		if ( owner !== this ) {
			// Methods `add` and `change` also provide alternate return types to their aliased counterparts.
			$.extend( this, {
				current: this.currentState,
				add: function () { return this.addState.apply( this, arguments ) ? this : false; },
				remove: this.removeState,
				change: function () { return this.changeState.apply( this, arguments ) ? this.owner() : false; },
				isIn: this.isInState,
				get: this.getState,
				method: this.getMethod
			});
		}
		
		( defaultState = $.extend( new State(), {
			controller: function () { return self; }
		}) ).build( definition );
		
		currentState = initialState ? this.getState( initialState ) : defaultState;
		currentState.controller() === this || ( currentState = this.createProxy( currentState ) );
	}, {
		overloads: {
			'object,string,object,string' : 'owner,name,definition,initialState',
			'object,string,object' : 'owner,name,definition',
			'object,object,string' : 'owner,definition,initialState',
			'string,object,string' : 'name,definition,initialState',
			'object,object' : 'owner,definition',
			'string,object' : 'name,definition',
			'object,string' : 'definition,initialState',
			'object' : 'definition',
			'string' : 'name'
		},
		prototype: {
			toString: function () {
				return this.currentState().toString();
			},
			match: function ( expr, testState ) {
				return this.currentState().match( expr, testState );
			},
			getState: function ( expr, context ) {
				return expr === undefined ? this.currentState() : ( context || this ).match( expr );
			},
			is: function ( expr, context ) {
				return this.getState( expr, context ) === this.currentState();
			},
			isInState: function ( expr, context ) {
				var	state = this.getState( expr, context ),
					currentState = this.currentState();
				return state === currentState || state.isSuperstateOf( currentState );
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
			 * @see State.Controller.changeState
			 */
			changeState: function ( destination, options, setCurrentState, setTransition ) {
				var	destinationOwner, source, origin, domain, data, state,
					owner = this.owner(),
					transition = this.transition(),
					self = this;

				// Translate `destination` argument to a proper `State` object if necessary.
				destination instanceof State || ( destination = destination ? this.getState( destination ) : this.defaultState() );
				
				if ( !destination ||
						( destinationOwner = destination.owner() ) !== owner &&
						!destinationOwner.isPrototypeOf( owner )
				) {
					throw new Error( "Invalid state" );
				}
				
				options || ( options = {} );
				origin = transition ? transition.origin() : this.currentState();
				if ( options.forced ||
						origin.evaluateRule( 'allowDepartureTo', destination ) &&
						destination.evaluateRule( 'allowArrivalFrom', origin )
				) {
					// If `destination` is a state from a prototype, create a transient protostate proxy and
					// reset `destination` to that.
					destination && destination.controller() !== this && ( destination = this.createProxy( destination ) );
					
					// If a transition is underway, it needs to be notified that it won't finish.
					transition && transition.abort();
					
					source = state = this.currentState();
					domain = source.common( destination );
					source.triggerEvents( 'depart', data );
					
					// Look up transition for origin/destination pairing; if none then create a default
					// transition.
					// TODO: transition lookup
					setCurrentState( transition = setTransition( new State.Transition( source, destination ) ) );
					data = { transition: transition, forced: !!options.forced };
					
					// Walk up to the top of the domain, bubbling 'exit' events along the way
					while ( state !== domain ) {
						state.triggerEvents( 'exit', data );
						transition.attachTo( state = state.superstate() );
					}
					
					// Finish with a closure function to be executed upon completion
					transition.setCallback( function () {
						var pathToState = [];
						
						// Trace a path from `destination` up to `domain`, then walk down it, capturing 'enter'
						// events along the way
						for ( state = destination; state !== domain; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.triggerEvents( 'enter', data );
						}
						
						setCurrentState( destination );
						this.currentState().triggerEvents( 'arrive', data );
						
						origin instanceof State.Proxy && ( this.destroyProxy( origin ), origin = null );
						transition.destroy(), transition = setTransition( null );
						
						typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					// Initiate transition and return asynchronously
					transition.start.apply( transition, options.arguments );
					return this;
				} else {
					typeof options.failure === 'function' && options.failure.call( this );
					return false;
				}
			},
			getMethod: function ( methodName ) {
				return this.currentState().method( methodName );
			},
			superstate: function ( methodName ) {
				var superstate = this.currentState().superstate();
				return methodName === undefined ? superstate : superstate.method( methodName );
			}
		},
		
		forObject: function () {
			var controller = State.Controller.apply( undefined, arguments );
			controller.owner()[ controller.name() ] = controller;
			return controller.owner();
		}
	}
);
