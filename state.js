( function ( $, undefined ) {

var State = $.extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			// ( Object ) => State.Definition( map )
			// ( Object, Object ) => State.Controller( owner, map )
			// ( Object, Object, String ) => State.Controller( owner, map, initialState )
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		if ( !( definition instanceof State.Definition ) ) {
			definition = State.Definition( definition );
		}
		
		var	state = this,
			methods = {},
			events = {},
			rules = {},
			substates = [],
			getName;
		
		// deprivatize these for now to allow visibility to inspectors
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		$.extend( this, {
			// this idiom keeps the value readonly while exposing it directly on the accessor function
			name: ( getName = function () { return name || ''; } ).toString = getName,
			superstate: function () { return superstate; },
			method: function ( methodName ) {
				return (
					methods[ methodName ]
						||
					( superstate && superstate.method( methodName ) )
						||
					undefined
				);
			},
			hasMethod: function ( methodName, deep ) {
				return (
					methodName in methods
						||
					deep && superstate && superstate.hasMethod( methodName, deep )
				);
			},
			addMethod: function ( methodName, fn ) {
				return methods[ methodName ] = fn;
			},
			removeMethod: function ( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			addEventListener: function ( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.add(fn);
			},
			removeEventListener: function ( eventType, id ) {
				return events[ eventType ].remove(id);
			},
			getEventListener: function ( eventType, id ) {
				return events[ eventType ].get(id);
			},
			getEventListeners: function ( eventType ) {
				return events[ eventType ];
			},
			triggerEvents: function ( eventType, data ) {
				if ( events[ eventType ] ) {
					return events[ eventType ].trigger( data );
				} else {
					throw new Error( "Invalid event type" );
				}
			},
			rule: function ( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			addState: function ( stateName, stateDefinition ) {
				var state = this[ stateName ] = new State( this, stateName, stateDefinition )
				substates.push( state );
				return state;
			},
			removeState: function () {
				throw new Error( "Not implemented" );
			},
			substates: function ( deep ) {
				if ( deep ) {
					var result = [];
					for ( var i in substates ) {
						result = result.concat( substates[i], substates[i].substates( true ) );
					}
					return result;
				} else {
					return substates.slice(0);
				}
			}
		});
		
		// Create an event collection for each supported event type
		$.each( [ 'enter', 'leave', 'capture', 'bubble' ], function ( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		$.each({
			methods: function ( methodName, fn ) {
				state.addMethod( methodName, fn );
			},
			events: function ( eventType, fn ) {
				if ( $.isArray( fn ) ) {
					$.each( fn, function ( i, fn ) {
						state.addEventListener( eventType, fn );
					});
				} else {
					state.addEventListener( eventType, fn );
				}
			},
			rules: function ( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			states: function ( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			}
		}, function ( i, fn ) {
			if ( definition[i] ) {
				$.each( definition[i], fn );
			}
		});
	}, {
		prototype: {
			toString: function () {
				return ( this.superstate() ? this.superstate() + '.' : '' ) + this.name();
			},
			controller: function () {
				return this.superstate().controller();
			},
			depth: function () {
				for ( var count = 0, state = this; state.superstate(); count++, state = state.superstate() );
				return count;
			},
			common: function ( other ) {
				var state;
				for ( ( this.depth() > other.depth() ) ? ( state = other, other = this ) : ( state = this );
						state;
						state = state.superstate() ) {
					if ( state === other || state.isSuperstateOf( other ) ) {
						return state;
					}
				}
			},
			isSuperstateOf: function ( state ) {
				var superstate = state.superstate();
				return superstate ? ( this === superstate || this.isSuperstateOf( superstate ) ) : false;
			},
			select: function () {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
			},
			// deprecated
			allowLeavingTo: function ( toState ) {
				return true;
			},
			// deprecated
			allowEnteringFrom: function ( fromState ) {
				return true;
			},
			evaluateRule: function ( ruleName, testState ) {
				var	state = this,
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					$.each( rule, function ( selector, value ) {
						$.each( selector.split(','), function ( i, expr ) {
							if ( state.match( $.trim( expr ), testState ) ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
				}
				return ( result === undefined ) || result;
			},
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					locus = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					result;
				
				if ( parts.length ) {
					$.each( parts, function ( i, name ) {
						if ( name === '' ) {
							locus = locus.superstate();
						} else if ( locus[ name ] instanceof State ) {
							locus = locus[ name ];
						} else if ( name == '*' ) {
							result = testState ? locus === testState.superstate() : locus.substates();
							return false;
						} else if ( name == '**' ) {
							result = testState ? locus.isSuperstateOf( testState ) : locus.substates( true );
							return false;
						} else {
							return result = false;
						}
					});
					return (
						result !== undefined ? result :
						!testState || locus === testState ? locus :
						false
					);
				} else {
					return locus;
				}
			}
		}
	}
);


State.Definition = $.extend( true,
	function StateDefinition ( map ) {
		if ( !( this instanceof State.Definition ) ) {
			return new State.Definition( map );
		}
		$.extend( true, this, map instanceof State.Definition ? map : State.Definition.expand( map ) );
	}, {
		members: [ 'methods', 'events', 'rules', 'states' ],
		blankMap: function () {
			var map = {};
			$.each( this.members, function ( i, key ) {
				map[key] = null;
			});
			return map;
		},
		isComplex: function ( map ) {
			var result;
			$.each( this.members, function ( i, key ) {
				return !( result = ( key in map && !$.isFunction( map[key] ) ) );
			});
			return result;
		},
		expand: function ( map ) {
			var result = this.blankMap();
			if ( $.isArray( map ) ) {
				$.each( this.members, function ( i, key ) {
					return i < map.length && ( result[key] = map[i] );
				});
			} else if ( $.isPlainObject( map ) ) {
				$.extend( this.isComplex( map ) ? result : ( result.methods = {} ), map );
			}
			if ( result.events ) {
				$.each( result.events, function ( type, value ) {
					if ( typeof value === 'function' ) {
						result.events[type] = value = [ value ];
					}
					if ( !$.isArray(value) ) {
						throw new Error();
					}
				});
			}
			if ( result.states ) {
				$.each( result.states, function ( name, map ) {
					result.states[name] = map instanceof State.Definition ? map : State.Definition( map );
				});
			}
			return result;
		},
		create: function ( shorthand ) {
			var map = this.blankMap();
			if ( $.isPlainObject( shorthand ) ) {
				map.methods = shorthand;
			} else if ( $.isArray( shorthand ) ) {
				$.each( this.members, function ( i, key ) {
					return i < shorthand.length && ( map[key] = shorthand[i] );
				});
			} else {
				throw new Error();
			}
			return map;
		},
		
		Set: function StateDefinitionSet ( map ) {
			$.each( map, function ( name, definition ) {
				if ( !( definition instanceof State.Definition ) ) {
					map[name] = State.Definition( definition );
				}
			});
			$.extend( true, this, map );
		}
	}
);


State.Controller = $.extend( true,
	function StateController ( owner, name, map, initialState ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, map, initialState );
		}
		var args = this.constructor.overload( arguments, this.constructor.overloadMap );
		owner = args.owner;
		name = args.name;
		map = args.map;
		initialState = args.initialState;
		
		var	controller = this,
			defaultState = $.extend( new State(), {
				controller: function() { return controller; }
			}),
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
			addState: function ( stateName, definition ) {
				if ( !( definition instanceof State.Definition ) ) {
					definition = new State.Definition( definition );
				}
				
				var	state = controller[ stateName ] = defaultState.addState( stateName, definition );
				
				if ( definition.methods ) {
					for ( var methodName in definition.methods ) {
						if ( !defaultState.hasMethod( methodName ) ) {
							if ( owner[ methodName ] !== undefined ) {
								defaultState.addMethod( methodName, owner[ methodName ] );
							}
							owner[ methodName ] = function () {
								try {
									return controller.getMethod( methodName ).apply( owner, arguments );
								} catch ( ex ) {
									ex.message = "Invalid method call for current state";
									throw ex;
								}
							};
						}
					}
				}
				return state;
			},
			removeState: function ( stateName ) {
				throw new Error( "State.Controller.removeState not implemented yet" );
			},
			changeState: function ( toState, success, fail ) {
				var state, common, data, pathToState = [];
				if ( !( toState instanceof State ) ) {
					toState = toState ? this.getState( toState ) : defaultState;
				}
				if ( !( toState && toState.controller() === this ) ) {
					throw new Error( "Invalid state" );
				}
				if ( currentState.evaluateRule( 'allowLeavingTo', toState ) ) {
					if ( toState.evaluateRule( 'allowEnteringFrom', currentState ) ) {
						// walk up to common ancestor, triggering bubble events along the way
						data = { origin: currentState, destination: toState };
						currentState.triggerEvents( 'leave', data );
						common = currentState.common( toState );
						for ( state = currentState; state != common; state = state.superstate() ) {
							state.triggerEvents( 'bubble', data );
						}
						// walk down to toState, triggering capture events along the way
						for ( state = toState; state != common; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							pathToState.pop().triggerEvents( 'capture', data );
						}
						currentState = toState;
						currentState.triggerEvents( 'enter', data );
						typeof success === 'function' && success.call( this );
						return this;
					} else {
						console && console.log( toState + '.allowEnteringFrom(' + currentState + ') denied' );
						typeof fail === 'function' && fail.call( this );
						return false;
					}
				} else {
					console && console.log( currentState + '.allowLeavingTo(' + toState + ') denied' );
					typeof fail === 'function' && fail.call( this );
					return false;
				}
			}
		});
		
		// For convenience, if implemented as an agent, expose a set of terse aliases
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
		overloadMap: {
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
		overload: function ( args, map ) {
			var	i,
				types = [],
				names,
				result = {};
			for ( i in args ) {
				if ( args[i] === undefined ) { break; }
				types.push( typeof args[i] );
			}
			if ( types.length && ( ( types = types.join() ) in map ) ) {
				names = map[ types ].split(',');
				for ( i in names ) {
					result[ names[i] ] = args[i];
				}
			}
			return result;
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


State.Event = $.extend( true,
	function StateEvent ( state, type ) {
		$.extend( this, {
			target: state,
			name: state.name,
			type: type
		});
	}, {
		prototype: {
			toString: function () {
				return 'StateEvent (' + this.type + ') ' + this.name;
			},
			log: function ( text ) {
				console && console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
			}
		},
		Collection: $.extend( true,
			function StateEventCollection ( state, type ) {
				var	items = {},
					length = 0,
					getLength = ( getLength = function () { return length; } ).toString = getLength;
					
				$.extend( this, {
					length: getLength,
					get: function ( id ) {
						return items[id];
					},
					key: function ( listener ) {
						for ( var i in items ) {
							if ( items[i] === listener ) {
								return i;
							}
						}
					},
					keys: function () {
						var result = [];
						result.toString = function () { return '[' + result.join() + ']'; };
						for ( var i in items ) {
							result.push( items[i] );
						}
						return result;
					},
					add: function ( fn ) {
						var id = this.guid();
						items[id] = fn;
						length++;
						return id;
					},
					remove: function ( id ) {
						var fn = items[id];
						if ( fn ) {
							delete items[id];
							length--;
							return fn;
						}
						return false;
					},
					empty: function () {
						if ( length ) {
							for ( var i in items ) {
								delete items[i];
							}
							length = 0;
							return true;
						} else {
							return false;
						}
					},
					trigger: function ( data ) {
						for ( var i in items ) {
							items[i].apply( state, [ $.extend( new State.Event( state, type ), data ) ] );
						}
					}
				});
			}, {
				__guid__: 0,
				prototype: {
					guid: function () {
						return ( ++this.constructor.__guid__ ).toString();
					}
				}
			}
		)
	}
);


State.Transition = $.extend( true,
	function StateTransition ( fromState, toState ) {
		
	}, {
		prototype: $.extend( true, new State(), {
			start: function () {
				
			},
			abort: function () {
				
			},
			finish: function () {
				
			}
		}),
		
		Definition: $.extend( true,
			function StateTransitionDefinition ( map ) {
				
			}, {
				
			}
		)
	}
);


$.State = window.State = State;

})(jQuery);

