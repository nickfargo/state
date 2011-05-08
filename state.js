// State.js
// 
// Copyright © (C) 2011 Nick Fargo, Z Vector Inc.
// 
// License MIT
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

( function ( $, undefined ) {
"use strict";

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
			return ( arguments.length < 2 ? State.Definition : State.Controller.forObject ).apply( this, arguments );
		}
		
		var	self = this,
			destroyed = false,
			methods = {},
			events = {},
			rules = {},
			substates = {},
			getName;
		
		// deprivatize these for now to allow visibility to inspectors
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			substates: substates
		});

		$.extend( this, {
			/**
			 * Returns the **superstate**
			 */
			superstate: function () { return superstate; },
			
			/**
			 * Returns an object array of this state's superstate chain, starting after the default state
			 * and ending at `this`.
			 * 
			 * @param byName:Boolean  Returns a string array of the states' names, rather than references
			 */
			derivation: function ( byName ) {
				for ( var result = [], s, ss = this;
						( s = ss ) && ( ss = s.superstate() );
						ss && result.unshift( byName ? s.name() || '' : s )
					);
				return result;
			},
			
			/**
			 * Returns the **protostate**, the state analogous to `this` found in the next object in the
			 * owner's prototype chain that has one. A state inherits from both its protostate and
			 * superstate, *in that order*.
			 * 
			 * If the owner does not share an analogous `StateController` with its prototype, or if no
			 * protostate can be found in the hierarchy of the prototype's state controller, then the
			 * search is iterated up the prototype chain.
			 * 
			 * Notes:
			 * (1) A state and its protostate will always share an identical name and identical
			 * derivation pattern.
			 * (2) The individual superstates of both a state and its protostate will also adhere to
			 * point (1).
			 */
			protostate: function () { //// TODO: needs more unit tests
				var	derivation = this.derivation( true ),
					controller = this.controller(),
					controllerName = controller.name(),
					owner = controller.owner(),
					prototype = owner,
					state, protostate;
				
				function iterate () {
					prototype = prototype.__proto__ || prototype.constructor.prototype;
					protostate = prototype &&
							prototype.hasOwnProperty( controllerName ) &&
							prototype[ controllerName ] instanceof State.Controller ?
						prototype[ controllerName ].defaultState() :
						undefined;
				}
				
				for ( iterate(); protostate; iterate() ) {
					for ( state in derivation ) {
						if ( !( protostate = protostate[ derivation[ state ] ] ) ) {
							break;
						}
					}
					if ( protostate ) {
						return protostate;
					}
				}
			},
			
			// directly expose the value while keeping it readonly (a convenience for viewing in Chrome inspector)
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			definition: function () { return definition; },
			
			build: function ( definitionOverride ) {
				definitionOverride && ( definition = definitionOverride );
				definition instanceof State.Definition || ( definition = State.Definition( definition ) );
				// TODO: (???) destroy()
				$.each(
					{
						methods: function ( methodName, fn ) {
							self.addMethod( methodName, fn );
						},
						events: function ( eventType, fn ) {
							if ( $.isArray( fn ) ) {
								$.each( fn, function ( i, fn ) {
									self.addEvent( eventType, fn );
								});
							} else {
								self.addEvent( eventType, fn );
							}
						},
						rules: function ( ruleName, rule ) {
							self.addRule( ruleName, rule );
						},
						states: function ( stateName, stateDefinition ) {
							self.addState( stateName, stateDefinition );
						}
					},
					function ( i, fn ) {
						definition[i] && $.each( definition[i], fn );
					}
				);
				return this;
			},
			
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
			method: function ( methodName, viaSuper, viaProto ) {
				var protostate;
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					methods[ methodName ]
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && superstate && superstate.method( methodName, true, viaProto )
						||
					undefined
				);
				
				return this.methodAndContext( methodName, viaSuper, viaProto ).method;
			},
			
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			methodAndContext: function ( methodName, viaSuper, viaProto ) {
				var	protostate,
					result = {};
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					( result.method = methods[ methodName ] ) && ( result.context = this, result )
						||
					viaProto && ( protostate = this.protostate() ) &&
							( result = protostate.methodAndContext( methodName, false, true ) ) && ( result.context = this, result )
						||
					viaSuper && superstate && superstate.methodAndContext( methodName, true, viaProto )
						||
					undefined
				);
			},
			
			/**
			 * Adds a method to this state, callable from the context of the owner.
			 */
			addMethod: function ( methodName, fn ) {
				var	controller = this.controller(),
					defaultState = controller.defaultState(),
					owner = controller.owner(),
					ownerMethod;
				if ( !this.method( methodName, true, false ) ) {
					if ( this !== defaultState &&
						!defaultState.method( methodName, false, false ) &&
						( ownerMethod = owner[ methodName ] ) !== undefined &&
						!ownerMethod.isDelegate
					) {
						ownerMethod.callAsOwner = true;
						defaultState.addMethod( methodName, ownerMethod );
					}
					owner[ methodName ] = State.delegate( methodName, controller );
				}
				return ( methods[ methodName ] = fn );
			},
			
			removeMethod: function ( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			
			addEvent: function ( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new Error( "Invalid event type" );
				}
				return e.add( fn );
			},
			
			removeEvent: function ( eventType, id ) {
				return events[ eventType ].remove( id );
			},
			
			getEvent: function ( eventType, id ) {
				return events[ eventType ].get( id );
			},
			
			getEvents: function ( eventType ) {
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
				var protostate;
				return (
					definition && definition.rules && definition.rules[ ruleName ]
						||
					( protostate = this.protostate() ) && protostate.rule( ruleName )
					 	||
					undefined
				);
			},
			
			addRule: function ( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			
			removeRule: function ( ruleName, ruleKey ) {
				throw new Error( "Not implemented" );
			},
			
			/**
			 * Creates and adds a substate.
			 */
			addState: function ( stateName, stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller && controller.defaultState() === this && ( controller[ stateName ] = substate );
				return substate;
			},
			
			/**
			 * 
			 */
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
			
			/**
			 * 
			 */
			substate: function ( stateName, viaProto ) { //// untested
				var protostate;
				viaProto === undefined && ( viaProto = true );
				return (
					substates[ stateName ] ||
					viaProto && ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined )
				);
			},
			
			/**
			 * Returns an `Array` of this state's substates.
			 */
			// TODO: rewrite to consider protostates
			substateCollection: function ( deep ) { //// untested
				var result = [], i;
				for ( i in substates ) {
					result.push( substates[i] );
					deep && ( result = result.concat( substates[i].substateCollection( true ) ) );
				}
				return result;
			},
			
			/**
			 * 
			 */
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
			events[ eventType ] = new State.Event.Collection( self, eventType );
		});
		
		// If no superstate, then assume this is a default state being created by a StateController,
		// which will call build() itself after overriding controller()
		superstate && this.build();
	}, {
		prototype: {
			/**
			 * Returns this state's fully qualified name.
			 */
			toString: function () {
				return this.derivation( true ).join('.');
			},
			
			controller: function () {
				return this.superstate().controller();
			},
			
			owner: function () {
				return this.controller().owner();
			},
			
			/**
			 * Returns the number of superstates this state has. The root default state returns `0`, its
			 * immediate substates return `1`, etc.
			 */
			depth: function () {
				for ( var count = 0, state = this; state.superstate(); count++, state = state.superstate() );
				return count;
			},
			
			/**
			 * Returns the state that is the nearest superstate, or the state itself, of both `this` and `other`.
			 * Used to establish a common domain between any two states in a hierarchy.
			 */
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
			
			/**
			 * Determines whether `this` is or is a substate of `state`.
			 */
			isIn: function ( state ) { //// untested
				state instanceof State || ( state = this.match( state ) );
				return ( state === this || state.isSuperstateOf( this ) );
			},
			
			/**
			 * Determines whether `this` is a superstate of `state`.
			 */
			isSuperstateOf: function ( state ) {
				var superstate;
				state instanceof State || ( state = this.match( state ) );
				return ( superstate = state.superstate() ) ? ( this === superstate || this.isSuperstateOf( superstate ) ) : false;
			},
			
			/**
			 * Determines whether `this` is a state analogous to `state` on any object in the prototype
			 * chain of `state`'s owner.
			 */
			isProtostateOf: function ( state ) { //// untested
				var protostate;
				state instanceof State || ( state = this.match( state ) );
				return ( protostate = state.protostate() ) ? ( this === protostate || this.isProtostateOf( protostate ) ) : false;
			},
			
			/**
			 * Determines whether `this` directly possesses a method named `methodName`.
			 */
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			
			select: function () {
				return this.controller().changeState( this ) && this;
			},
			isSelected: function () {
				return this.controller().currentState() === this;
			},
			change: function ( state ) {
				return this.controller().changeState( state ) && state;
			},
			
			/**
			 * Returns the Boolean result of the rule function at `ruleName` defined on this state, as
			 * evaluated against `testState`, or `true` if no rule exists.
			 */
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
			
			/**
			 * Matches a string expression `expr` with the state or states it represents, evaluated in the
			 * context of `this`.
			 * 
			 * Returns the matched state, the set of matched states, or a Boolean indicating whether
			 * `testState` is included in the matched set.
			 */
			match: function ( expr, testState ) {
				var	parts = expr.split('.'),
					cursor = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					cursorSubstate,
					result;
				
				if ( parts.length ) {
					$.each( parts, function ( i, name ) {
						if ( name === '' ) {
							cursor = cursor.superstate();
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
		},
		
		/**
		 * Returns a function that forwards a `methodName` call to `controller`, which will itself then
		 * forward the call on to the appropriate implementation in the state hierarchy as determined by
		 * the controller's current state. If the forwarded method is on the default state and was originally
		 * a method of the controller's owner, then it will be executed in its original context; Otherwise,
		 * it will be executed in the context of the state to which the selected method implementation
		 * belongs, or if the implementation resides in a protostate, the context will be the corresponding
		 * `StateProxy` within `controller`.
		 * 
		 * The result of this is that, for a method defined in a state, `this` refers to the state in which
		 * it is defined (or a proxy state pointing to the protostate in which the method is defined), while
		 * methods originally defined on the owner object itself will still have `this` set to the owner.
		 * 
		 * @see State.addMethod
		 */
		delegate: function ( methodName, controller ) {
			function delegate () {
				var	data = controller.currentState().methodAndContext( methodName );
				if ( data ) {
					if ( data.context === controller.defaultState() && data.method.callAsOwner ) {
						data.context = controller.owner();
					}
					return data.method.apply( data.context, arguments );
				}
			}
			delegate.isDelegate = true;
			return delegate;
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


/**
 * StateProxy allows a state controller to reference a protostate from within its own state hierarchy.
 */
State.Proxy = $.extend( true,
	function StateProxy ( superstate, name ) {
		var	getName;
		$.extend( this, {
			superstate: function () { return superstate; },
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			// State may invalidate this proxy if state gets destroyed or removed
			invalidate: function () {
				// tell controller to eject itself
			}
		});
	}, {
		prototype: $.extend( true, new State(), {
			rule: function ( ruleName ) {
				// TODO: this.protostate() isn't resolving when it should
						// CAUSE: derived object doesn't have its StateController.name set, so it can't match with prototype's StateController
				if ( !this.protostate() ) {
					debugger;
				}
				return this.protostate().rule( ruleName );
			}
		})
	}
);

State.Transition = $.extend( true,
	function StateTransition ( source, destination, action, callback ) {
		var	transition = this,
			attachment = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
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
			setCallback: function ( fn ) { callback = fn; },
			aborted: function () { return aborted; },
			start: function () {
				aborted = false;
				typeof action === 'function' ? action.apply( this, arguments ) : this.end();
			},
			abort: function () {
				aborted = true;
				callback = null;
				return this;
			},
			end: function ( delay ) {
				if ( delay ) {
					return setTimeout( function () { transition.end(); }, delay );
				}
				aborted || callback && callback.apply( controller );
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

})( jQuery );

