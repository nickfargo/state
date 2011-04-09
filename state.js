( function ( $, undefined ) {

var Util = {
	slice: function ( array, begin, end ) {
		return Array.prototype.slice.call( array, begin, end );
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
		args = this.slice( args );
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
$ || ( $ = Util );


var State = $.extend( true,
	function State ( superstate, name, definition ) {
		if ( !( this instanceof State ) ) {
			// ( Object ) => State.Definition( map )
			// ( Object, Object ) => State.Controller( owner, map )
			// ( Object, Object, String ) => State.Controller( owner, map, initialState )
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		var	state = this,
			destroyed = false,
			methods = {},
			events = {},
			rules = {},
			// substates = [], // TODO: {}
			substates = {},
			getName, getFullName;
		
		// deprivatize these for now to allow visibility to inspectors
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		$.extend( this, {
			superstate: function () { return superstate; },
			
			/**
			 * Returns an object array of this state's superstate chain, starting after the default state and ending at `this`.
			 * 
			 * @param byName:Boolean  Returns a string array of the states' names, rather than references
			 */
			derivation: function ( byName ) {
				for ( var result = [], s, ss = this; ( s = ss ) && ( ss = s.superstate() ); ss && result.unshift( byName ? s.name() || '' : s ) );
				return result;
			},
			
			/**
			 * Returns the **protostate**, the state analogous to `this` found in the next object in the owner's prototype chain that
			 * has one. A state inherits from both its protostate and superstate, *in that order*.
			 * 
			 * If the owner does not share an analogous `StateController` with its prototype, or if no protostate can be found in the
			 * hierarchy of the prototype's state controller, then the search is iterated up the prototype chain.
			 * 
			 * Points of fact:
			 * (1) A state and its protostate will always share an identical name and identical derivation pattern.
			 * (2) The individual superstates of both a state and its protostate will also adhere to point (1).
			 */
			protostate: function () { //// untested
				var	derivation = this.derivation( true ),
					controller = this.controller(),
					controllerName = controller.name(),
					owner = controller.owner(),
					proto = owner,
					s, ps;
				
				function iterateProto () {
					proto = proto.__proto__ || proto.constructor.prototype,
					ps = proto && proto.hasOwnProperty( controllerName ) && proto[ controllerName ] instanceof State.Controller ?
						proto[ controllerName ].defaultState() :
						undefined;
				}
				
				for ( iterateProto(); ps; iterateProto() ) {
					for ( s in derivation ) {
						if ( !( ps = ps[ derivation[s] ] ) ) {
							break;
						}
					}
					if ( ps ) {
						return ps;
					}
				}
			},
			
			// directly expose the value while keeping it readonly (a convenience for viewing in Chrome inspector)
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			fullName: ( getFullName = function () {
				var d = this.derivation();
				return d && d.join('.') || '';
			} ).toString = getFullName,
			
			definition: function () { return definition; },
			
			build: function ( definitionOverride ) {
				definitionOverride && ( definition = definitionOverride );
				definition instanceof State.Definition || ( definition = State.Definition( definition ) );
				// TODO: (???) destroy()
				$.each(
					{
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
					},
					function ( i, fn ) {
						if ( definition[i] ) {
							$.each( definition[i], fn );
						}
					}
				);
				return this;
			},
			
			// TODO: add argument `controller`
			method: function ( methodName, viaSuper, viaProto ) {
				var protostate;
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				// return methods[ methodName ] || ( deep && superstate && superstate.method( methodName, true ) ) || undefined;
				
				return (
					methods[ methodName ]
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && superstate && superstate.method( methodName, true, viaProto )
				);
			},
			
			// // TODO: default `deep` to true, or add method `hasOwnMethod()`
			// hasMethod: function ( methodName, viaSuper, viaProto ) {
			// 	var protostate;
			// 	return (
			// 		methodName in methods
			// 			||
			// 		viaProto && ( protostate = this.protostate() ) && protostate.hasMethod( methodName, false, true )
			// 			||
			// 		viaSuper && superstate && superstate.hasMethod( methodName, true, viaProto )
			// 	);
			// },
			// hasMethod_OLD: function ( methodName, deep ) {
			// 	return methodName in methods || ( deep && superstate && superstate.hasMethod_OLD( methodName, true ) );
			// },
			
			addMethod: function ( methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner();
				// if ( !this.hasMethod( methodName, true ) != !this.hasMethod_OLD( methodName, true ) ) {
				// 	debugger;
				// }
				if ( !this.method( methodName, true, false ) ) {
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
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.trigger( data );
			},
			
			rule: function ( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			
			addState: function ( stateName, stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller && controller.defaultState() === this && ( controller[ stateName ] = substate );
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
					// evacuate before removing
					if ( controller.isInState( substate ) ) {
						controller.changeState( this, { forced: true } );
					}
					delete substates[ stateName ];
					return substate;
				}
			},
			
			substate: function ( stateName ) { //// untested
				var protostate;
				return substates[ stateName ] || ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined );
			},
			
			// TODO: rewrite to consider protostates
			substateCollection: function ( deep ) { //// untested
				var result = [], i;
				for ( i in substates ) {
					result.push( substates[i] );
					deep && ( result = result.concat( substates[i].substateCollection( true ) ) );
				}
				return result;
			},
			
			destroy: function () {
				var	controller = this.controller(),
					transition = controller.transition(),
					origin,
					destination;
				if ( transition ) {
					origin = transition.origin();
					destination = transition.destination();
					if (
						this === origin || this.isSuperstateOf( origin )
							||
						this === destination || this.isSuperstateOf( destination )
					) {
						// TODO: defer destroy() until transition finish()
						return false;
					}
				}
				for ( var i in substates ) {
					substates[i].destroy();
				}
				destroyed = true;
				
			}
		});
		
		// Create an event collection for each supported event type
		$.each( [ 'enter', 'exit', 'arrive', 'depart' ], function ( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		
		// If no superstate, then assume this is a default state being created by a StateController,
		// which will call build() itself after overriding controller()
		superstate && this.build();
	}, {
		prototype: {
			toString: function () {
				return this.derivation( true ).join('.');
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
			isProtostateOf: function ( state ) { //// untested
				var protostate = state.protostate();
				return protostate ? ( this === protostate || this.isProtostateOf( protostate ) ) : false;
			},
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			select: function () {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
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
			
			// Match a string expression `expr` with the state or states it represents.
			// Returns the matched state, the set of matched states, or a boolean indicating whether `testState` is included in the matched set.
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					cursor = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					cursorSubstate,
					result;
				
				if ( parts.length ) {
					$.each( parts, function ( i, name ) {
						if ( name === '' ) {
							cursor = cursor.superstate();
						// } else if ( cursor[ name ] instanceof State ) {
						} else if ( cursorSubstate = cursor.substate( name ) ) {
							cursor = cursorSubstate;
						} else if ( name == '*' ) {
							result = testState ? cursor === testState.superstate() : cursor.substateCollection();
							return false;
						} else if ( name == '**' ) {
							result = testState ? cursor.isSuperstateOf( testState ) : cursor.substateCollection( true );
							return false;
						} else {
							return result = false;
						}
					});
					return (
						result !== undefined ? result :
						!testState || cursor === testState ? cursor :
						false
					);
				} else {
					return cursor;
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
				if ( this.isComplex( map ) ) {
					$.extend( result, map );
				} else {
					for ( var key in map ) {
						var m = /^_*[A-Z]/.test( key ) ? 'states' : 'methods';
						( result[m] || ( result[m] = {} ) )[key] = map[key];
					}
				}
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
	function StateController ( owner, name, definition, initialState ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, definition, initialState );
		}
		var args = Util.resolveOverloads( arguments, this.constructor.overloads );
		owner = args.owner;
		name = args.name || 'state';
		definition = args.definition instanceof State.Definition ? args.definition : State.Definition( args.definition );
		initialState = args.initialState;
		
		var	controller = this,
			defaultState,
			currentState,
			transition,
			getName;
		
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
			changeState: function ( toState, options ) {
				var source, transition, origin, state, common, data;
				
				if ( !( toState instanceof State ) ) {
					toState = toState ? this.getState( toState ) : defaultState;
				}
				if ( !( toState && toState.controller() === this ) ) {
					throw new Error( "Invalid state" );
				}
				
				options || ( options = {} );
				origin = transition ? transition.origin() : currentState;
				if ( options.forced ||
						origin.evaluateRule( 'allowDepartureTo', toState ) &&
						toState.evaluateRule( 'allowArrivalFrom', origin )
				) {
					transition && transition.abort();
					
					// lookup transition for currentState/toState pairing, if none then create a default transition
					source = currentState;
					currentState = transition = new State.Transition( source, toState );
					common = source.common( toState );
					data = { transition: transition, forced: !!options.forced };
					
					// walk up to common ancestor, bubbling 'exit' events along the way
					source.triggerEvents( 'depart', data );
					for ( state = source; state != common; state = state.superstate() ) {
						transition.attachTo( state.superstate() );
						state.triggerEvents( 'exit', data );
					}
					
					// initiate transition and return asynchronously, with the provided closure to be executed upon completion
					transition.start( function () {
						var pathToState = [];
						
						// trace path from `toState` up to `common`, then walk down it, capturing 'enter' events along the way
						for ( state = toState; state !== common; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.triggerEvents( 'enter', data );
						}
						
						currentState = toState;
						currentState.triggerEvents( 'arrive', data );
						transition.destroy();
						transition = null;
						
						typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					return this;
				} else {
					typeof options.failure === 'function' && options.failure.call( this );
					return false;
				}
			}
		});
		
		// For convenience and semantic brevity, if implemented as an agent, expose a set of aliases for selected methods
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
		
		( defaultState = $.extend( new State(), {
			controller: function() { return controller; }
		}) ).build( definition );
		
		currentState = this.getState( initialState ) || defaultState;
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
		var	transition = this,
			attachment = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			callback,
			aborted;
		
		$.extend( this, {
			superstate: function () { return attachment; },
			attachTo: function ( state ) {
				attachment = state;
			},
			controller: function () { return controller; },
			origin: function () {
				return source instanceof State.Transition ? source.origin() : source;
			},
			source: function () { return source; },
			destination: function () { return destination; },
			aborted: function () { return aborted; },
			start: function ( fn ) {
				aborted = false;
				callback = fn;
				typeof action === 'function' ? action.apply( this, Util.slice( arguments, 0, -1 ) ) : this.finish();
			},
			abort: function () {
				aborted = true;
				callback = null;
				return this;
			},
			finish: function () {
				aborted || callback.apply( controller );
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = attachment = controller = null;
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


this.State = State;

})(jQuery);

