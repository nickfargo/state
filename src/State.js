var State = $.extend( true,
	function State( controller, name, methods, events, rules ) {
		if ( !( this instanceof arguments.callee ) ) {
			var controller = arguments.callee.Controller.apply( this, arguments );
			controller.owner.state = controller;
			return controller.owner;
		}
		console.warn('State constructor : rules argument not implemented yet');
		
		methods = methods || {};
		rules = rules || {};
		
		var state = this,
			eventListeners = {
				enter: [],
				leave: []
			};
		
		$.extend( this, {
			controller: controller,
			name: name || '',
			hasMethod: function(name) {
				return name in methods;
			},
			getMethod: function(name) {
				return methods[name];
			},
			addMethod: function( name, fn ) {
				return ( methods[name] = fn );
			},
			removeMethod: function(name) {
				var fn = methods[name];
				delete methods[name];
				return fn;
			},
			addEventListener: function( type, fn ) {
				eventListeners[type].push(fn);
			},
			removeEventListener: function( type, fn ) {
				if ( typeof fn === 'function' ) {
					var i = $.inArray( fn, eventListeners[type] );
					if ( i != -1 ) {
						eventListeners[type].splice(i, 1);
					}
				} else {
					eventListeners[type].splice(fn, 1);
				}
			},
			triggerEvents: function( type ) {
				if ( eventListeners[type] ) {
					$.each( eventListeners[type], function(i, fn) {
						var event = new State.Event( state, type );
						fn.apply( state, [ event ] );
					});
				} else {
					throw new Error('Invalid event type');
				}
			}
		});
		
		if (events) {
			$.each( events, function( type, fn ) {
				if ( fn instanceof Array ) {
					$.each( fn, function( i, fn ) {
						state.addEventListener( type, fn );
					});
				} else {
					state.addEventListener( type, fn );
				}
			});
		}
		
		if (rules) {
			$.each( rules, function( ruleName, states ) {
				if (states) $.each( states, function( stateName, fn ) {
					// something to rework the allow_() functions
					// StateController.change()
				});
			});
		}
	}, {
		prototype: {
			toString: function() {
				return this.name;
			},
			select: function() {
				return this.controller.change( this.name ) ? this : false;
			},
			allowLeavingTo: function( toState ) {
				return true;
			},
			allowEnteringFrom: function( fromState ) {
				return true;
			}
		},
		
		define: function( map ) {
			console.warn('State.define implementation under construction');
			return new State.Definition( map );
		},
		
		Definition: function StateDefinition( map ) {
			$.extend( true, this, map );
		},
		
		Controller: $.extend( true,
			function StateController( owner, map, initialState ) {
				if ( !( this instanceof arguments.callee ) ) {
					return new State.Controller( owner, map, initialState );
				}
				
				var controller = this;
				
				$.extend( this, {
					owner: owner,
					__default__: new State(this),
					addState: function( name, methods, events, rules ) {
						if ( methods instanceof State.Definition ) {
							rules = methods.rules;
							events = methods.events;
							methods = methods.methods;
						}
						var state = ( controller[ name ] = new State( controller, name, methods, events, rules ) );
						if ( methods ) {
							$.each( methods, function( methodName, fn ) {
								if (
									!controller.__default__.hasMethod( methodName )
										&&
									(
										!owner[ methodName ]
											||
										typeof owner[ methodName ] === 'function'
									)
								){
									controller.__default__.addMethod( methodName, owner[ methodName ] );
									owner[ methodName ] = function() {
										var method = controller.getMethod( methodName );
										return method.apply( owner, arguments );
									};
								}
							});
						}
						return state;
					},
					removeState: function( name ) {
						throw new Error('State.Controller.removeState not implemented yet');
					},
					getState: function() {
						return currentState;
					},
					getMethod: function( methodName ) {
						return this.getState().getMethod( methodName ) || this.__default__.getMethod( methodName );
					},
					change: function( toState ) {
						if ( !( toState instanceof State && toState.controller === this ) ) {
							toState =( toState ? this[ toState ] : this.__default__ );
							if ( !toState ) {
								throw new Error('Invalid state');
							}
						}
						if ( currentState.allowLeavingTo( toState ) ) {
							if ( toState.allowEnteringFrom( currentState ) ) {
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
				
				if ( map ) {
					$.each( map, function( stateName, members ) {
						var stateMethods, stateEvents, stateRules;
						if ( members instanceof State.Definition ) {
							stateMethods = members.methods;
							stateEvents = members.events;
							stateRules = members.rules;
						} else if ( members instanceof Array ) {
							stateMethods = members[0];
							stateEvents = members[1];
						} else {
							stateMethods = members; 
						}
						controller.addState( stateName, stateMethods, stateEvents, stateRules );
					});
				}
				
				var currentState = this[ initialState ] || this.__default__;
			}, {
				prototype: {
					toString: function() {
						return this.getState().toString();
					},
					__default__: {},
					is: function( stateName ) {
						var	state = this.getState(),
							name = state.name || '';
						if ( stateName === undefined ) {
							return name;
						}
						return ( name === stateName ) ? state : false;
					}
				}
			}
		),
		
		Event: $.extend( true,
			function StateEvent( state, type ) {
				$.extend( this, {
					target: state,
					name: state.name,
					type: type
				});
			}, {
				prototype: {
					toString: function() {
						return 'StateEvent';
					}
				}
			}
		)
	}
);
