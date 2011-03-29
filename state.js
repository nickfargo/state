( function ( $, undefined ) {

var Utilities = {
	slice: function ( a, n ) {
		return Array.prototype.slice.apply( a, n );
	},
	extend: function ( target ) {
		return target;
	},
	each: function ( collection, fn ) {
		return collection;
	},
	isArray: function ( obj ) {
		return false;
	},
	isFunction: function ( obj ) {
		return false;
	},
	resolveOverloads: function ( args, map ) {
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
	}
};
$ || ( $ = Utilities );


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
			// this idiom keeps the value readonly while exposing it directly on the accessor function, useful for inspectors
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
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner();
				if ( !this.hasMethod( methodName, true ) ) {
					if ( superstate && owner[ methodName ] !== undefined ) {
						defaultState.addMethod( methodName, owner[ methodName ] );
					}
					owner[ methodName ] = function () {
						var method = controller.getMethod( methodName );
						return method ? method.apply( owner, arguments ) : undefined;
					}
				}
				return ( methods[ methodName ] = fn );
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
				return e.add( fn );
			},
			removeEventListener: function ( eventType, id ) {
				return events[ eventType ].remove( id );
			},
			getEventListener: function ( eventType, id ) {
				return events[ eventType ].get( id );
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
				var	substate = this[ stateName ] = new State( this, stateName, stateDefinition );
				substates.push( substate );
				return substate;
			},
			removeState: function ( stateName ) {
				// throw new Error( "Not implemented" );
				
				var	substate = substates[ stateName ],
					controller,
					current;
				if ( substate ) {
					controller = this.controller();
					current = controller.currentState();
					// if controller is inside `substate`, eject to `this`
					if ( controller.isInState( substate ) ) {
						controller.changeState( this, { forced: true } );
					}
					delete substates[ stateName ];
					return substate;
				}
			},
			substates: function ( deep ) {
				if ( deep ) {
					var result = [];
					for ( var i in substates ) {
						result = result.concat( substates[i], substates[i].substates( true ) );
					}
					return result;
				} else {
					return substates.slice();
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
					if ( !$.isArray( value ) ) {
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
		var args = Utilities.resolveOverloads( arguments, this.constructor.overloads );
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
						currentState.evaluateRule( 'allowLeavingTo', toState ) &&
						toState.evaluateRule( 'allowEnteringFrom', currentState )
				) {
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
						for ( state = toState; state != common; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.triggerEvents( 'capture', data );
						}
					
						currentState = toState;
						currentState.triggerEvents( 'enter', data );
						transition.destroy();
					
						options.success && typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					return this;
				} else {
					options.fail && typeof options.fail === 'function' && options.fail.call( this );
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
	function StateTransition ( source, destination, action ) {
		var	superstate = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			callback,
			aborted;
		
		$.extend( this, {
			superstate: function () {
				return superstate;
			},
			attachTo: function ( state ) {
				superstate = state;
			},
			controller: function () {
				return controller;
			},
			origin: function () {
				return source instanceof State.Transition ? source.origin() : source;
			},
			source: function () {
				return source;
			},
			destination: function () {
				return destination;
			},
			start: function ( fn ) {
				callback = fn;
				action ? action() : this.finish();
			},
			abort: function () {
				aborted = true;
			},
			finish: function () {
				aborted || callback.apply( controller );
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = superstate = controller = undefined;
			}
		});
	}, {
		prototype: $.extend( true, new State(), {
			depth: function () {
				for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
				return count;
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

