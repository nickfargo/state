//( function($) {

var State = $.extend( true,
	function State( parent, definition ) {
		/*
		 * If invoked directly, use this function as shorthand for the
		 * State.Definition constructor.
		 */
		if ( !( this instanceof State ) ) {
			return State.Definition.apply( this, arguments );
		}
		
		if ( !( definition instanceof State.Definition ) ) {
			definition = State.Definition( definition );
		}
		
		var	state = this,
			eventListeners = {},
			childStates = {};
		
		$.each( [ 'enter', 'leave', 'enterChildState', 'leaveChildState' ], function( i, type ) {
			eventListeners[type] = new State.Event.Collection();
		});
		
		$.extend( this, {
			name: function() {
				return name || '';
			},
			parent: function() {
				return parent;
			},
			method: function(name) {
				return definition.methods[name];
			},
			hasMethod: function(name) {
				return name in definition.methods;
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
				var e = eventListeners[type];
				if (e) {
					return eventListeners[type].add(fn);
				} else {
					throw new State.EventError('Invalid event type');
				}
			},
			removeEventListener: function( type, id ) {
				return eventListeners[type].remove(id);
			},
			triggerEvents: function( type ) {
				if ( eventListeners[type] ) {
					$.each( eventListeners[type], function( id, fn ) {
						var event = new State.Event( state, type );
						fn.apply( state, [ event ] );
					});
				} else {
					throw new State.EventError('Invalid event type');
				}
			},
			addState: function( stateName, stateDefinition ) {
				this[ stateName ] = childStates[ stateName ] = new State( this, stateDefinition );
			},
			removeState: function() {
				throw new State.Error('Not implemented');
			}
		});
		
		if ( definition.events ) {
			$.each( definition.events, function( type, fn ) {
				if ( fn instanceof Array ) {
					$.each( fn, function( i, fn ) {
						state.addEventListener( type, fn );
					});
				} else {
					state.addEventListener( type, fn );
				}
			});
		}
		
		if ( definition.rules ) {
			$.each( definition.rules, function( ruleName, ruleStates ) {
				if ( ruleStates ) {
					$.each( ruleStates, function( stateName, fn ) {
						// something to rework the allow_() functions
						// StateController.change()
					});
				}
			});
		}
		
		if ( definition.states ) {
			$.each( definition.states, function( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			});
		}
	}, {
		prototype: {
			controller: function() {
				return this.parent() instanceof State ? this.parent().controller() : this.parent();
			}
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
		
		object: function() {
			var controller = State.Controller.apply( this, arguments );
			controller.owner.state = controller;
			return controller.owner;
		},
		
		define: function( map ) {
			console.warn('State.define : marked for deprecation, use State.Definition() instead');
			return new State.Definition( map );
		},
		
		Definition: $.extend( true,
			function StateDefinition( map ) {
				if ( !( this instanceof State.Definition ) ) {
					return new StateDefinition( map );
				}
				
				var mapIsShorthand = $.isArray( map );
				if ( !mapIsShorthand && $.isPlainObject( map ) ) {
					$.each( this.constructor.members, function(i,key) {
						return mapIsShorthand = !( key in map && !$.isFunction( map[key] ) );
					});
				}
				
				$.extend( true, this, mapIsShorthand ? this.constructor.create( map ) : map );
			}, {
				members: ['methods','events','rules','states'],
				blankMap: function() {
					var map = {};
					$.each( this.members, function(i,key) { map[key] = null; } );
					return ( this.blankMap = function() { return map; } )();
				},
				create: function( shorthand ) {
					var map = this.blankMap();
					if ( $.isPlainObject( shorthand ) ) {
						map.methods = shorthand;
					} else if ( $.isArray( shorthand ) ) {
						$.each( this.members, function(i,key) {
							return i < shorthand.length && map[key] = shorthand[i];
						});
					} else {
						throw new State.DefinitionError();
					}
					return map;
				},
				
				Set: function StateDefinitionSet( map ) {
					$.each( map, function( name, definition ) {
						if ( !( definition instanceof State.Definition ) ) {
							map[name] = State.Definition( definition );
						}
					});
					$.extend( true, this, map );
				}
			}
		),
		
		Controller: $.extend( true,
			function StateController( owner, map, initialState ) {
				if ( !( this instanceof State.Controller ) ) {
					return new State.Controller( owner, map, initialState );
				}
				
				var	controller = this,
					defaultState = new State(this);
				
				$.extend( this, {
					owner: owner,
					addState: function( name, definition ) {
						if ( !( definition instanceof State.Definition ) ) {
							definition = new State.Definition( definition );
						}
						var state = ( controller[ name ] = new State( controller, definition ) );
						if ( definition.methods.length ) {
							$.each( definition.methods, function( methodName, fn ) {
								if ( !defaultState.hasMethod( methodName ) ) {
									if ( owner[ methodName ] !== undefined ) {
										defaultState.addMethod( methodName, owner[ methodName ] );
									}
									owner[ methodName ] = function() {
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
//					old_addState: function( name, methods, events, rules, states ) {
//						if ( methods instanceof State.Definition ) {
//							rules = methods.rules;
//							events = methods.events;
//							methods = methods.methods;
//							states = methods.states;
//						}
//						var state = ( controller[ name ] =
//							new State( controller, name, methods, events, rules, states ) );
//						if ( methods ) {
//							$.each( methods, function( methodName, fn ) {
//								if (
//									!controller.__default__.hasMethod( methodName )
//										&&
//									(
//										!owner[ methodName ]
//											||
//										typeof owner[ methodName ] === 'function'
//									)
//								){
//									controller.__default__.addMethod( methodName, owner[ methodName ] );
//									owner[ methodName ] = function() {
//										var method = controller.getMethod( methodName );
//										return method.apply( owner, arguments );
//									};
//								}
//							});
//						}
//						return state;
//					},
					removeState: function( name ) {
						throw new Error('State.Controller.removeState not implemented yet');
					},
					getState: function() {
						return currentState;
					},
					getDefaultState: function() {
						return defaultState;
					},
					getMethod: function( methodName ) {
						return this.getState().getMethod( methodName ) || defaultState.getMethod( methodName );
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
					var set = map instanceof State.Definition.Set ? map : new State.Definition.Set( map );
					$.each( set, function( stateName, definition ) {
						controller.addState( stateName, definition );
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
				},
				Collection: $.extend( true,
					function StateEventCollection() {
						var	items = {},
							length = 0;
						
						$.extend( this, {
							length: function() {
								return length;
							},
							add: function(fn) {
								var id = this.guid();
								items[id] = fn;
								length++;
								return id;
							},
							remove: function(id) {
								var fn = items[id];
								if ( fn ) {
									delete items[id];
									length--;
									return fn;
								}
								return false;
							},
							empty: function() {
								if ( length ) {
									for( var i in items ) {
										delete items[i];
									}
									length = 0;
									return true;
								} else {
									return false;
								}
							}
						});
					}, {
						__guid__: 0,
						prototype: {
							guid: function() {
								return ( ++this.constructor.__guid__ ).toString();
							}
						}
					}
				)
			}
		),
		
		Error: $.extend( true,
			function StateError( message ) {
				this.message = message;
			}, {
				prototype: Error
			}
		),
		EventError: $.extend( true,
			function StateEventError( message ) {
				this.message = message;
			}, {
				prototype: State.Error
			}
		),
		DefinitionError: $.extend( true,
			function StateDefinitionError( message ) {
				this.message = message;
			}, {
				prototype: State.Error
			}
		)
	}
);

//$.State = State;
//
//})(jQuery);
