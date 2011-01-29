( function( $, undefined ) {

var State = $.extend( true,
	function State( parent, name, definition ) {
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
			eventListeners[type] = new State.Event.Collection( state, type );
		});
		
		$.extend( this, {
			name: name || '',
			getName: function() {
				return name || '';
			},
			parent: function() {
				return parent;
			},
			method: function( methodName ) {
				return definition.methods[ methodName ];
			},
			hasMethod: function( methodName ) {
				return methodName in definition.methods;
			},
			addMethod: function( methodName, fn ) {
				return ( methods[ methodName ] = fn );
			},
			removeMethod: function( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
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
					return eventListeners[type].trigger();
				} else {
					throw new State.EventError('Invalid event type');
				}
			},
			addState: function( stateName, stateDefinition ) {
				this[ stateName ] = childStates[ stateName ] = new State( this, stateName, stateDefinition );
			},
			removeState: function() {
				throw new State.Error('Not implemented');
			},
			rule: function( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
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
		
		if ( definition.states ) {
			$.each( definition.states, function( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			});
		}
	}, {
		prototype: {
			controller: function() {
				var parent = this.parent();
				return parent instanceof State ? parent.controller() : parent;
			},
			toString: function() {
				return ( this.parent() instanceof State ? this.parent().toString() + '.' : '' ) + this.getName();
			},
			select: function() {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function() {
				return this.controller().currentState() === this;
			},
			allowLeavingTo: function( toState ) {
				return true;
			},
			allowEnteringFrom: function( fromState ) {
				return true;
			},
			evaluateRule: function( ruleName, testState ) {
				var	state = this,
					rule = this.rule( ruleName );
				if ( rule ) {
					var result;
					$.each( rule, function( selector, value ) {
						// TODO: support wildcard
						$.each( selector.split(','), function( i, expr ) {
							if ( state.controller().getState( $.trim(expr), state ) === testState ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
					return result;
				}
				return true;
			}
		},
		
		object: function() {
			var controller = State.Controller.apply( this, arguments );
			controller.owner().state = controller;
			return controller.owner();
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
				
				var isShort = $.isArray( map );
				if ( !isShort && $.isPlainObject( map ) ) {
					$.each( this.constructor.members, function( i, key ) {
						return isShort = !( key in map && !$.isFunction( map[key] ) );
					});
				}
				$.extend( true, this, isShort ? this.constructor.create( map ) : map );
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
							return i < shorthand.length && ( map[key] = shorthand[i] );
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
				
				// Pseudoverloads: [ (map,initialState), (owner,map), (map), () ]
				if ( arguments.length < 2 || typeof map === 'string' ) {
					initialState = map;
					map = owner;
					owner = this;
				}
				
				var	controller = this,
					defaultState = new State(this);
				
				$.extend( this, {
					owner: function() {
						return owner;
					},
					defaultState: function() {
						return defaultState;
					},
					currentState: function() {
						return currentState;
					},
					addState: function( name, definition ) {
						if ( !( definition instanceof State.Definition ) ) {
							definition = new State.Definition( definition );
						}
						var state = ( controller[ name ] = new State( controller, name, definition ) );
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
					removeState: function( name ) {
						throw new Error('State.Controller.removeState not implemented yet');
					},
					changeState: function( toState ) {
						if ( !( toState instanceof State ) ) {
							toState = toState ? this.getState( toState ) : defaultState;
						}
						if ( !( toState && toState.controller() === this ) ) {
							throw new Error('Invalid state');
						}
						if ( currentState.evaluateRule( 'allowLeavingTo', toState ) ) {
							if ( toState.evaluateRule( 'allowEnteringFrom', currentState ) ) {
								// TODO: walk up to common ancestor and then down to 'toState', triggering events along the way
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
				
				// For convenience expose terse alias set if implemented as an agent
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
					var set = map instanceof State.Definition.Set ? map : new State.Definition.Set( map );
					$.each( set, function( stateName, definition ) {
						controller.addState( stateName, definition );
					});
				}
				
				var currentState = this.getState( initialState ) || this.defaultState();
			}, {
				prototype: {
					toString: function() {
						return this.getState().toString();
					},
					__default__: {},
					isInState: function( stateName ) {
						var	state = this.getState(),
							name = state.getName() || '';
						if ( stateName === undefined ) {
							return name;
						}
						return ( name === stateName ) ? state : false;
					},
					getMethod: function( methodName ) {
						return this.getState().getMethod( methodName ) || this.defaultState().getMethod( methodName );
					},
					getState: function( expr, context ) {
						if ( expr === undefined ) {
							return this.currentState();
						} else if ( typeof expr === 'string' ) {
							if ( !expr ) {
								return context || this.defaultState();
							}
							if ( expr.charAt(0) == '.' ) {
								if ( !context ) {
									context = this.currentState();
								}
								expr = expr.substr(1);
							}
							if ( expr.charAt( expr.length - 1 ) == '.' ) {
								expr = expr.substr( 0, expr.length - 1 );
							}
							var	locus = context || this,
								parts = expr.split('.');
							$.each( parts, function( i, name ) {
								if ( name === '' ) {
									locus = locus.parent();
								} else if ( locus[name] instanceof State ) {
									locus = locus[name];
								} else {
									throw new State.Error('Invalid state expression');
								}
							});
							return locus instanceof State.Controller ? locus.defaultState() : locus;
						} else {
							throw new State.Error('Invalid state expression');
						}
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
					function StateEventCollection( state, type ) {
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
							},
							trigger: function() {
								$.each( items, function( id, fn ) {
									fn.apply( state, [ new State.Event( state, type ) ] );
								});
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
				prototype: this.Error
			}
		),
		DefinitionError: $.extend( true,
			function StateDefinitionError( message ) {
				this.message = message;
			}, {
				prototype: this.Error
			}
		)
	}
);
$.State = window.State = State;

})(jQuery);
