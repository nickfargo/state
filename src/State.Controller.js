State.Controller = $.extend( true,
	function StateController ( owner, map, initialState ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, map, initialState );
		}
		
		// Pseudoverloads: [ (map,initialState), (owner,map), (map), () ]
		if ( arguments.length < 2 || typeof map === 'string' ) {
			initialState = map;
			map = owner;
			owner = this;
		}
		
		var	controller = this,
			defaultState = new State( this ),
			currentState = defaultState;
		
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
			addState: function ( name, definition ) {
				if ( !( definition instanceof State.Definition ) ) {
					definition = new State.Definition( definition );
				}
				
				var	state = controller[ name ] = defaultState.addState( name, definition );
				
				if ( definition.methods ) {
					$.each( definition.methods, function ( methodName, fn ) {
						if ( !defaultState.hasMethod( methodName ) ) {
							if ( owner[ methodName ] !== undefined ) {
								defaultState.addMethod( methodName, owner[ methodName ] );
							}
							owner[ methodName ] = function () {
								var method = controller.getMethod( methodName );
								if ( method ) {
									return method.apply( owner, arguments );
								} else if ( defaultState[ methodName ] ) {
									return defaultState[ methodName ];
								} else {
									throw new State.Error('Invalid method call for current state');
								}
							};
						}
					});
				}
				return state;
			},
			removeState: function ( name ) {
				throw new Error('State.Controller.removeState not implemented yet');
			},
			changeState: function ( toState ) {
				if ( !( toState instanceof State ) ) {
					toState = toState ? this.getState( toState ) : defaultState;
				}
				if ( !( toState && toState.controller() === this ) ) {
					throw new Error('Invalid state');
				}
				if ( currentState.evaluateRule( 'allowLeavingTo', toState ) ) {
					if ( toState.evaluateRule( 'allowEnteringFrom', currentState ) ) {
						// TODO: walk up to common ancestor and then down to 'toState', triggering bubble/capture events along the way
						currentState.triggerEvents('leave');
						currentState = toState;
						currentState.triggerEvents('enter');
						return controller;
					} else {
						console.warn( toState + '.allowEnteringFrom(' + currentState + ') denied' );
						return false;
					}
				} else {
					console.warn( currentState + '.allowLeavingTo(' + toState + ') denied' );
					return false;
				}
			}
		});
		
		// For convenience, if implemented as an agent, expose a set of terse aliases
		if ( owner !== this ) {
			$.extend( this, {
				current: this.currentState,
				add: this.addState,
				remove: this.removeState,
				change: this.changeState,
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
				return methodName ? superstate.method( methodName ) : superstate;
			}
		}
	}
);
