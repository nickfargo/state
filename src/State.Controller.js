State.Controller = $.extend( true,
	function StateController ( owner, name, map, initialState ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, map, initialState );
		}
		var args = Util.resolveOverloads( arguments, this.constructor.overloads );
		owner = args.owner;
		name = args.name;
		map = args.map;
		initialState = args.initialState;
		
		var	controller = this,
			defaultState = $.extend( new State(), {
				controller: function() { return controller; }
			}),
			currentState = defaultState,
			transition;
		
		$.extend( this, {
			owner: function () {
				return owner;
			},
			defaultState: function () {
				return defaultState;
			},
			currentState: function () {
				return currentState;
			},
			transition: function () {
				return transition;
			},
			addState: function ( stateName, definition ) {
				if ( !( definition instanceof State.Definition ) ) {
					definition = new State.Definition( definition );
				}
				return ( controller[ stateName ] = defaultState.addState( stateName, definition ) );
			},
			removeState: function ( stateName ) {
				throw new Error( "State.Controller.removeState not implemented yet" );
			},
			changeState: function ( toState, options ) {
				var source, transition, state, common, data;
				options || ( options = {} );
				if ( !( toState instanceof State ) ) {
					toState = toState ? this.getState( toState ) : defaultState;
				}
				if ( !( toState && toState.controller() === this ) ) {
					throw new Error( "Invalid state" );
				}
				
				if ( options.forced ||
						( transition ? transition.origin() : currentState ).evaluateRule( 'allowLeavingTo', toState ) &&
						toState.evaluateRule( 'allowEnteringFrom', currentState )
				) {
					transition && transition.abort();
					
					// lookup transition for currentState/toState pairing, if none then create a default transition
					source = currentState;
					currentState = transition = new State.Transition( source, toState );
					common = source.common( toState );
					data = { transition: transition, forced: !!options.forced };
					
					// walk up to common ancestor, triggering bubble events along the way
					source.triggerEvents( 'leave', data );
					for ( state = source; state != common; state = state.superstate() ) {
						transition.attachTo( state.superstate() );
						state.triggerEvents( 'bubble', data );
					}
					
					// initiate transition, with closure to be executed upon completion
					transition.start( function () {
						var pathToState = [];
						
						// trace path from `toState` up to `common`, then walk down, triggering capture events along the way
						for ( state = toState; state !== common; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length || ( pathToState = undefined ) ) {
							transition.attachTo( state = pathToState.pop() );
							state.triggerEvents( 'capture', data );
						}
						
						currentState = toState;
						currentState.triggerEvents( 'enter', data );
						transition.destroy();
						transition = null;
						
						typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					return this;
				} else {
					typeof options.fail === 'function' && options.fail.call( this );
					return false;
				}
			}
		});
		
		// For convenience and semantic brevity, if implemented as an agent, expose a set aliases for selected methods
		if ( owner !== this ) {
			$.extend( this, {
				current: this.currentState,
				add: function () { return this.addState.apply( this, arguments ) ? this : false; },
				remove: this.removeState,
				change: function () { return this.changeState.apply( this, arguments ) ? this.owner() : false; },
				is: this.isInState,
				get: this.getState,
				method: this.getMethod
			});
		}
		
		if ( map ) {
			var defs = map instanceof State.Definition.Set ? map : new State.Definition.Set( map );
			$.each( defs, function ( stateName, definition ) {
				controller.addState( stateName, definition );
			});
		}
		
		currentState = this.getState( initialState ) || this.defaultState();
	}, {
		overloads: {
			'object,string,object,string' : 'owner,name,map,initialState',
			'object,string,object' : 'owner,name,map',
			'object,object,string' : 'owner,map,initialState',
			'string,object,string' : 'name,map,initialState',
			'object,object' : 'owner,map',
			'string,object' : 'name,map',
			'object,string' : 'map,initialState',
			'object' : 'map',
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
				if ( expr === undefined ) {
					return this.currentState();
				}
				return context ? context.match( expr ) : this.match( expr );
			},
			isInState: function ( expr, context ) {
				var	state = this.getState( expr, context ),
					currentState = this.currentState();
				return state === currentState || state.isSuperstateOf( currentState ) ? state : false;
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
			var controller = State.Controller.apply( null, arguments );
			controller.owner().state = controller;
			return controller.owner();
		}
	}
);
