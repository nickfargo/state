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
			methods = {},
			events = {},
			rules = {},
			childStates = {},
			getName;
//			getName = function() { return name || ''; },
//			getParent = function() { return parent; };
		
//		getName.toString = getName;
//		getParent.toString = function() { return parent instanceof State ? parent.name() : parent.constructor.name };
		
		$.extend( this, {
//			name: getName,
			name: ( getName = function() { return name || ''; } ).toString = getName,
//			parent: getParent,
			parent: function() { return parent; },
			method: function( methodName ) {
				return methods[ methodName ];
			},
			hasMethod: function( methodName ) {
				return name in methods;
			},
			addMethod: function( methodName, fn ) {
				return methods[ methodName ] = fn;
			},
			removeMethod: function( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			addEventListener: function( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new State.EventError('Invalid event type');
				}
				return e.add(fn);
			},
			removeEventListener: function( eventType, id ) {
				return events[ eventType ].remove(id);
			},
			getEventListener: function( eventType, id ) {
				return events[ eventType ].get(id);
			},
			getEventListeners: function( eventType ) {
				return events[ eventType ];
			},
			triggerEvents: function( eventType ) {
				if ( events[ eventType ] ) {
					return events[ eventType ].trigger();
				} else {
					throw new State.EventError('Invalid event type');
				}
			},
			rule: function( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			addState: function( stateName, stateDefinition ) {
				this[ stateName ] = childStates[ stateName ] = new State( this, stateName, stateDefinition );
			},
			removeState: function() {
				throw new State.Error('Not implemented');
			}
		});
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			states: childStates
		});
		
		$.each( [ 'enter', 'leave', 'enterChildState', 'leaveChildState' ], function( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		$.each({
			methods: function( methodName, fn ) {
				state.addMethod( methodName, fn );
			},
			events: function( eventType, fn ) {
				if ( fn instanceof Array ) {
					$.each( fn, function( i, fn ) {
						state.addEventListener( eventType, fn );
					});
				} else {
					state.addEventListener( eventType, fn );
				}
			},
			rules: function( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			states: function( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			}
		}, function( i, fn ) {
			if ( definition[i] ) {
				$.each( definition[i], fn );
			}
		});
		
//		if ( definition.methods ) {
//			$.each( definition.methods, function( methodName, fn ) {
//				state.addMethod( methodName, fn );
//			});
//		}
//		if ( definition.events ) {
//			$.each( definition.events, function( eventType, fn ) {
//				if ( fn instanceof Array ) {
//					$.each( fn, function( i, fn ) {
//						state.addEventListener( eventType, fn );
//					});
//				} else {
//					state.addEventListener( eventType, fn );
//				}
//			});
//		}
//		if ( definition.rules ) {
//			$.each( definition.rules, function( ruleName, rule ) {
//				rules[ ruleName ] = rule;
//			});
//		}
//		if ( definition.states ) {
//			$.each( definition.states, function( stateName, stateDefinition ) {
//				state.addState( stateName, stateDefinition );
//			});
//		}
	}, {
		prototype: {
			controller: function() {
				var parent = this.parent();
				return parent instanceof State ? parent.controller() : parent;
			},
			toString: function() {
				return ( this.parent() instanceof State ? this.parent().toString() + '.' : '' ) + this.name();
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
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					$.each( rule, function( selector, value ) {
						// TODO: support wildcard
						$.each( selector.split(','), function( i, expr ) {
							if ( state.controller().getState( $.trim(expr) ) === testState ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
				}
				return ( result === undefined ) || result;
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
				
				////////////////////////////////////////////////
//				if ( map === undefined ) debugger;
//				if ( map instanceof State.Definition ) debugger;
				////////////////////////////////////////////////
				
				$.extend( true, this, map instanceof State.Definition ? map : this.constructor.expand( map ) );
			}, {
				members: [ 'methods', 'events', 'rules', 'states' ],
				blankMap: function() {
					var map = {};
					$.each( this.members, function(i,key) { map[key] = null; } );
					return map;
//					return ( this.blankMap = function() { return map; } )();
				},
				isComplex: function( map ) {
					var result;
					$.each( this.members, function( i, key ) {
						return !( result = ( key in map && !$.isFunction( map[key] ) ) );
					});
					return result;
				},
				expand: function( map ) {
					var result = this.blankMap();
					if ( $.isArray( map ) ) {
						$.each( this.members, function(i,key) {
							return i < map.length && ( result[key] = map[i] );
						});
					} else if ( $.isPlainObject( map ) ) {
//						if ( this.isComplex( map ) ) {
////							result = map;
//							$.extend( result, map );
//						} else {
////							result.methods = map;
//							$.extend( result.methods, map );
//						}
						$.extend( this.isComplex(map) ? result : ( result.methods = {} ), map );
					}
					if ( result.events ) {
						$.each( result.events, function( type, value ) {
							if ( typeof value === 'function' ) {
								result.events[type] = value = [value];
							}
							if ( !$.isArray(value) ) {
								debugger;
								throw new State.DefinitionError();
							}
						});
					}
					if ( result.states ) {
						$.each( result.states, function( name, map ) {
							result.states[name] = map instanceof State.Definition ? map : State.Definition(map);
//							result.states[name] = State.Definition(map);
						});
					}
					return result;
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
						debugger;
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
console.log( 'currentState: '+currentState );
						return currentState;
					},
					addState: function( name, definition ) {
						if ( !( definition instanceof State.Definition ) ) {
							definition = new State.Definition( definition );
						}
						var state = ( controller[ name ] = new State( controller, name, definition ) );
						if ( definition.methods ) {
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
console.log( 'changeState: toState='+toState );
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
					$.each( defs, function( stateName, definition ) {
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
console.log( 'isInState: stateName=' + stateName );
						var	state = this.getState(),
							name = state.name() || '';
						if ( stateName === undefined ) {
							return name;
						}
						return ( name === stateName ) ? state : false;
					},
					getMethod: function( methodName ) {
						return this.currentState().method( methodName ) || this.defaultState().getMethod( methodName );
					},
					getState: function( expr, context ) {
console.log( 'getState: expr=' + expr + ' context=' + context );
						
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
									throw new State.Error('Invalid state expression: locus='+locus+' name='+name+' context='+context+' expr='+expr);
								}
							});
							return locus instanceof State.Controller ? locus.defaultState() : locus;
						} else {
							throw new State.Error('Invalid state expressionuuuuu');
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
					},
					log: function(text) {
						console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
					}
				},
				Collection: $.extend( true,
					function StateEventCollection( state, type ) {
						var	items = {},
							length = 0,
							getLength = ( getLength = function() { return length; } ).toString = getLength;
							
//						getLength.toString = getLength;
						
						$.extend( this, {
							length: getLength,
							get: function(id) {
								return items[id];
							},
							key: function( listener ) {
								var result;
								$.each( items, function( id, fn ) {
									result = ( fn === listener ? id : undefined );
									return result === undefined;
								});
								return result;
							},
							keys: function() {
								var result = [];
								result.toString = function() { return '[' + result.join() + ']'; };
								$.each( items, function(key) {
									result.push(key);
								});
								return result;
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
				this.name = "StateError";
				this.message = message;
			}, {
				prototype: Error.prototype
			}
		),
		EventError: $.extend( true,
			function StateEventError( message ) {
				this.name = "StateEventError";
				this.message = message;
			}, {
				prototype: this.Error.prototype
			}
		),
		DefinitionError: $.extend( true,
			function StateDefinitionError( message ) {
				this.name = "StateDefinitionError";
				this.message = message;
			}, {
				prototype: this.Error.prototype
			}
		)
	}
);
$.State = window.State = State;

})(jQuery);
