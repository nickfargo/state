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

( function ( undefined ) {

/**
 * Locally identify the global object.
 */
var	global = this,
	debug = true,
	
	/**
	 * Save whatever value may have already existed at `State`.
	 */
	autochthon = global.State;

/**
 * # Utility functions
 * 
 * Heavy lifting from jQuery of only what we need
 */

// TODO: stick these in a $ var; use if jQuery doesn't already have us covered
var	toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty,
	trim = String.prototype.trim ?
		function ( text ) { return text == null ? '' : String.prototype.trim.call( text ); }:
		function ( text ) { return text == null ? '' : text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' ); };

function noop () {}

function type ( o ) { return o == null ? String( o ) : type.map[ toString.call( o ) ] || 'object'; }
type.map = {};
each( 'Boolean Number String Function Array Date RegExp Object'.split(' '), function( i, name ) {
	type.map[ "[object " + name + "]" ] = name.toLowerCase();
});

function isNumber( n ) { return !isNaN( parseFloat( n ) && isFinite( n ) ); }
function isArray ( o ) { return type( o ) === 'array'; }
function isFunction ( o ) { return type( o ) === 'function'; }
function isPlainObject ( o ) {
	if ( !o || type( o ) !== 'object' || o.nodeType || o === global ||
		o.constructor &&
		!hasOwn.call( o, 'constructor' ) &&
		!hasOwn.call( o.constructor.prototype, 'isPrototypeOf' )
	) {
		return false;
	}
	for ( var key in o ) {}
	return key === undefined || hasOwn.call( o, key );
}
function isEmpty( o ) {
	if ( isArray( o ) && o.length ) {
		return false;
	}
	for ( var key in o ) {
		if ( hasOwn.call( o, key ) ) {
			return false;
		}
	}
	return true;
}

function extend () {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( ( options = arguments[i] ) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject( copy ) || ( copyIsArray = isArray( copy ) ) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && isArray( src ) ? src : [];
					} else {
						clone = src && isPlainObject( src ) ? src : {};
					}
					
					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );
					
				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
}

function each ( obj, fn ) {
	if ( !obj ) return;
	var	key,
		length = obj.length;
	if ( length === undefined || isFunction( obj ) ) {
		for ( key in obj ) {
			if ( fn.call( obj[key], key, obj[key], obj ) === false ) {
				break;
			}
		}
	} else {
		for ( key = 0, length = obj.length; key < length; ) {
			if ( fn.call( obj[key], key, obj[key++], obj ) === false ) {
				break;
			}
		}
	}
	return obj;
}

function concat () { return Array.prototype.concat.apply( [], arguments ); }

function slice ( array, begin, end ) { return Array.prototype.slice.call( array, begin, end ); }

function keys ( o ) {
	var key, result = [];
	for ( key in o ) {
		result.push( i );
	}
	return result;
}

function invert ( array ) {
	var	i, map = {};
	for ( i in array ) {
		map[ array[i] ] = i;
	}
	return map;
}

function nullify ( o ) {
	for ( var i in o ) {
		o.hasOwnProperty( i ) && ( o[i] = null );
	}
	return o;
}

function nullHash( keys ) { return nullify( invert( keys ) ); }

function indirect ( subject, privileged, map ) {
	each( map, function ( names, args ) {
		each( names.split(' '), function ( i, methodName ) {
			var method = privileged[ methodName ].apply( undefined, args );
			subject[ methodName ] = function () { return method.apply( subject, arguments ); };
		});
	});
}

function mapOverloads ( args, map ) {
	var	i,
		types = [],
		names,
		result = {};
	for ( i in args ) {
		if ( args[i] === undefined ) { break; }
		types.push( type( args[i] ) );
	}
	if ( types.length && ( types = types.join(' ') ) in map ) {
		names = map[ types ].split(' ');
		for ( i in names ) {
			result[ names[i] ] = args[i];
		}
	}
	return result;
}

function subtract ( deep, target ) { //// untested
	var	args = slice( arguments ),
		i, key, obj,
		delta = {};
	deep === !!deep && args.shift();
	target = args[0];
	for ( i = args.length; --i; ) {
		obj = args[i];
		for ( key in obj ) {
			deep && isPlainObject( obj[key] ) && ( delta[key] = subtract( target[key], obj[key] ) ) ||
			!!obj[key] && ( delta[key] = target[key], delete target[key] );
		}
	}
	return delta;
}

/**
 * # State
 */

/**
 * Constructor for `State` typed objects, as well as the root namespace.
 */
var State = extend( true,
	/**
	 * 
	 */
	function State ( superstate, name, definition ) {
		/**
		 * If not invoked as a constructor, `State()` acts as an alias for acquiring either a `StateDefinition`
		 * object based on a single object map, or if also supplied with at least an `owner` object reference,
		 * a `StateController` object that is bound to the owner.
		 * 
		 * @see StateDefinition
		 * @see StateController
		 */
		if ( !( this instanceof State ) ) {
			return ( arguments.length < 2 ? State.Definition : State.Controller ).apply( this, arguments );
		}
		
		var	getName,
			self = this,
			destroyed = false,
			// history = [],
			data = {},
			methods = {},
			events = nullHash( State.Event.types ),
			rules = {},
			substates = {},
			transitions = {};
		
		/*
		 * Setter functions; these are passed as arguments to external privileged methods to provide access to
		 * free variables within the constructor.
		 */
		function setSuperstate ( value ) { return superstate = value; }
		function setDefinition ( value ) { return definition = value; }
		function setDestroyed ( value ) { return destroyed = !!value; }
		
		// expose these in debug mode
		debug && extend( this.__private__ = {}, {
			data: data,
			methods: methods,
			events: events,
			rules: rules,
			substates: substates,
			transitions: transitions
		});
		
		/**
		 * Get the state's name. Copying the function to its own `toString` exposes the value of `name`
		 * when the method is viewed in the Chrome web inspector.
		 */
		( this.name = function () { return name || ''; } ).toString = this.name;
		
		/**
		 * Get the `StateDefinition` that was used to define this state.
		 */
		this.definition = function () { return definition; };
		
		/*
		 * External privileged methods
		 * 
		 * Method names are mapped to specific internal free variables. The named methods are created on
		 * `this`, each of which is partially applied with its mapped free variables to the correspondingly
		 * named methods at `State.privileged`.
		 */
		indirect( this, State.privileged, {
			'init' : [ State.Definition, setDefinition ],
			'superstate' : [ superstate ],
			'data' : [ data ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event events addEvent removeEvent trigger' : [ events ],
			'rule addRule removeRule' : [ rules ],
			'substate substates addSubstate removeSubstate' : [ substates ],
			'transition transitions addTransition' : [ transitions ],
			'destroy' : [ setSuperstate, setDestroyed, methods, substates ]
		});
		
		/*
		 * If no superstate, then assume this is a default state being created by a StateController,
		 * which will call `init()` itself after overriding `controller`.
		 */
		superstate && this.init();
	}, {
		/*
		 * Privileged indirections, partially applied with private free variables from inside the constructor.
		 */
		privileged: {
			/**
			 * Builds out the state's members based on the contents of the supplied definition.
			 */
			init: function ( DefinitionConstructor, setDefinition ) {
				return function ( /*<DefinitionConstructor>|Object*/ definitionOverride ) {
					var	category,
						definition = definitionOverride || this.definition(),
						self = this;
					
					definition instanceof DefinitionConstructor ||
						setDefinition( definition = DefinitionConstructor( definition ) );
					
					definition.data && this.data( definition.data );
					each({
						methods: function ( methodName, fn ) {
							self.addMethod( methodName, fn );
						},
						events: function ( eventType, fn ) {
							isArray( fn ) || ( fn = [ fn ] );
							for ( var i in fn ) {
								self.addEvent( eventType, fn[i] );
							}
						},
						rules: function ( ruleType, rule ) {
							self.addRule( ruleType, rule );
						},
						states: function ( stateName, stateDefinition ) {
							self.addSubstate( stateName, stateDefinition );
						},
						transitions: function ( transitionName, transitionDefinition ) {
							self.addTransition( transitionName, transitionDefinition );
						}
					}, function ( category, fn ) {
						definition[category] && each( definition[category], fn );
					});
					
					this.trigger( 'construct', { definition: definition } );
					
					return this;
				};
			},
			
			/**
			 * Returns the immediate superstate, or the nearest state in the superstate chain with the
			 * provided `stateName`.
			 */
			superstate: function ( superstate ) {
				return function ( /*String*/ stateName ) {
					return stateName === undefined ?
						superstate
						:
						superstate ?
							stateName ?
								superstate.name() === stateName ?
									superstate : superstate.superstate( stateName )
								:
								this.controller().defaultState()
							:
							undefined;
				}
			},
			
			/**
			 * ( [Boolean viaSuper], [Boolean viaProto] )
			 * Gets the `data` attached to this state, including all data from inherited states, unless
			 * specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
			 * 
			 * ( Object edit, [Boolean isDeletion] )
			 * Sets the `data` on this state, overwriting any existing items, or if `!!isDeletion` is `true`,
			 * deletes from `data` the items with matching keys in `edit` whose values evaluate to `true`. If
			 * the operation causes `data` to be changed, a `mutate` event is generated for this state.
			 */
			data: function ( data ) {
				return function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
					var viaSuper, viaProto, key, superstate, protostate;
				
					// If first argument is a Boolean, interpret method call as a "get" with inheritance flags.
					typeof edit === 'boolean' && ( viaSuper = edit, viaProto = isDeletion, edit = false );
					viaSuper === undefined && ( viaSuper = true );
					viaProto === undefined && ( viaProto = true );
				
					if ( edit ) { // set
						( isDeletion ?
							!isEmpty( data ) && !isEmpty( edit ) && subtract( true, data, edit )
							:
							isEmpty( edit ) || extend( true, data, edit )
						) &&
							this.trigger( 'mutate', { edit: edit, isDeletion: isDeletion } );
						return this;
					} else { // get
						return isEmpty( data ) ?
							undefined
							:
							extend( true, {},
								viaSuper && ( superstate = this.superstate() ) && superstate.data(),
								viaProto && ( protostate = this.protostate() ) && protostate.data( false ),
								data );
					}
				}
			},
			
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
			method: function ( methods ) {
				return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
					var	superstate, protostate;
					
					viaSuper === undefined && ( viaSuper = true );
					viaProto === undefined && ( viaProto = true );
					
					return (
						methods[ methodName ]
							||
						viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
							||
						viaSuper && ( superstate = this.superstate() ) && superstate.method( methodName, true, viaProto )
							||
						undefined
					);
				};
			},
			
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			methodAndContext: function ( methods ) {
				return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
					var	superstate, protostate,
						result = {};
					
					viaSuper === undefined && ( viaSuper = true );
					viaProto === undefined && ( viaProto = true );
					
					return (
						( result.method = methods[ methodName ] ) && ( result.context = this, result )
							||
						viaProto && ( protostate = this.protostate() ) &&
								( result = protostate.methodAndContext( methodName, false, true ) ) && ( result.context = this, result )
							||
						viaSuper && ( superstate = this.superstate() ) && superstate.methodAndContext( methodName, true, viaProto )
							||
						result
					);
				};
			},
			
			/**
			 * Returns an `Array` of names of methods defined for this state.
			 */
			methodNames: function ( methods ) {
				return function () {
					return keys( methods );
				};
			},
			
			/**
			 * Adds a method to this state, which will be callable directly from the owner, but with its
			 * context bound to the state.
			 */
			addMethod: function ( methods ) {
				return function ( methodName, fn ) {
					var	controller = this.controller(),
						defaultState = controller.defaultState(),
						owner = controller.owner(),
						ownerMethod;
					/*
					 * If there is not already a method called `methodName` in the state hierarchy, then
					 * the owner and controller need to be set up properly to accommodate calls to this
					 * method.
					 */
					if ( !this.method( methodName, true, false ) ) {
						if ( this !== defaultState && !defaultState.method( methodName, false, false ) ) {
							if ( ( ownerMethod = owner[ methodName ] ) !== undefined && !ownerMethod.isDelegate ) {
								/*
								 * If the owner has a method called `methodName` that hasn't already been
								 * substituted with a delegate, then that method needs to be copied into to the
								 * default state, so that calls made from other states which do not implement
								 * this method can be forwarded to this original implementation of the owner.
								 * Before the method is copied, it is marked both as `autochthonous` to
								 * indicate that subsequent calls to the method should be executed in the
								 * context of the owner (as opposed to the usual context of the state for which
								 * the method was declared), and, if the method was not inherited from a
								 * prototype of the owner, as `autochthonousToOwner` to indicate that it must
								 * be returned to the owner should the controller ever be destroyed.
								 */
								ownerMethod.autochthonous = true;
								ownerMethod.autochthonousToOwner = owner.hasOwnProperty( methodName );
							} else {
								/*
								 * Otherwise, since the method being added has no counterpart on the owner, a
								 * no-op is placed on the default state instead.
								 */
								ownerMethod = noop;
							}
							defaultState.addMethod( methodName, ownerMethod );
						}
						/*
						 * A delegate function is instated on the owner, which will direct subsequent calls to
						 * `owner[ methodName ]` to the controller, and then on to the appropriate state's
						 * implementation.
						 */
						owner[ methodName ] = State.delegate( methodName, controller );
					}
					return ( methods[ methodName ] = fn );
				};
			},
			
			/**
			 * Dissociates the named method from this state object and returns its function.
			 */
			removeMethod: function ( methods ) {
				return function ( /*String*/ methodName ) {
					var fn = methods[ methodName ];
					delete methods[ methodName ];
					return fn;
				};
			},
			
			/**
			 * Gets a registered event handler.
			 */
			event: function ( events ) {
				return function ( /*String*/ eventType, /*String*/ id ) {
					return events[ eventType ].get( id );
				};
			},
			
			/**
			 * Gets an `Array` of all event handlers registered for the specified `eventType`.
			 */
			events: function ( events ) {
				return function ( /*String*/ eventType ) {
					return events[ eventType ];
				};
			},
			
			/**
			 * Binds an event handler to the specified `eventType` and returns a unique identifier for the
			 * handler. Recognized event types are listed at `State.Event.types`.
			 * @see State.Event
			 */
			addEvent: function ( events ) {
				return function ( /*String*/ eventType, /*Function*/ fn ) {
					if ( eventType in events ) {
						events[ eventType ] ||
							( events[ eventType ] = new State.Event.Collection( this, eventType ) );
						return events[ eventType ].add( fn );
					} else {
						throw new Error( "Invalid event type" );
					}
				};
			},
			
			/**
			 * Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
			 * @see State.addEvent
			 */
			removeEvent: function ( events ) {
				return function ( /*String*/ eventType, /*String*/ id ) {
					return events[ eventType ].remove( id );
				};
			},
			
			/**
			 * Used internally to invoke an event type's handlers at the appropriate time.
			 */
			trigger: function ( events ) {
				return function ( /*String*/ eventType, /*Object*/ data ) {
					var e;
					return eventType in events && ( e = events[ eventType ] ) && e.trigger( data ) && this;
				};
			},

			/**
			 * Gets a rule object for this state. Rules are inherited from protostates, but not from
			 * superstates.
			 */
			rule: function ( rules ) {
				return function ( /*String*/ ruleType ) {
					var protostate;
					return (
						rules[ ruleType ]
							||
						( protostate = this.protostate() ) && protostate.rule( ruleType )
						 	||
						undefined
					);
				};
			},
			
			/**
			 * Adds a rule to the state.
			 */
			addRule: function ( rules ) {
				return function ( /*String*/ ruleType, rule ) {
					rules[ ruleType ] = rule;
				};
			},
			
			/**
			 * 
			 */
			removeRule: function ( rules ) {
				return function ( /*String*/ ruleType, /*String*/ ruleKey ) {
					throw new Error( "Not implemented" );
				};
			},
			
			/**
			 * 
			 */
			substate: function ( substates ) {
				return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
					var protostate;
					viaProto === undefined && ( viaProto = true );
					return (
						substates[ stateName ] ||
						viaProto && ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined )
					);
				};
			},
			
			/**
			 * Returns an `Array` of this state's substates.
			 */
			// TODO: rewrite to consider protostates
			substates: function ( substates ) {
				return function ( /*Boolean*/ deep ) {
					var i,
						result = [];
					for ( i in substates ) {
						result.push( substates[i] );
						deep && ( result = result.concat( substates[i].substates( true ) ) );
					}
					return result;
				};
			},
			
			/**
			 * Creates a state from the supplied `stateDefinition` and adds it as a substate of this state.
			 * If a substate with the same `stateName` already exists, it is first destroyed and then replaced.
			 * If the new substate is being added to the controller's default state, a reference is added
			 * directly on the controller itself as well.
			 */
			addSubstate: function ( substates ) {
				return function ( /*String*/ stateName, /*StateDefinition | Object*/ stateDefinition ) {
					var	substate,
						controller = this.controller();
					( substate = substates[ stateName ] ) && substate.destroy();
					substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
					controller.defaultState() === this && ( controller[ stateName ] = substate );
					return substate;
				};
			},
			
			/**
			 * 
			 */
			removeSubstate: function ( substates ) {
				return function ( /*String*/ stateName ) {
					var	controller, current, transition,
						substate = substates[ stateName ];
				
					if ( substate ) {
						controller = this.controller();
						current = controller.current();
					
						// Fail if a transition is underway involving `substate`
						if (
							( transition = controller.transition() )
								&&
							(
								substate.isSuperstateOf( transition ) ||
								substate === transition.origin() ||
								substate === transition.destination()
							)
						) {
							return false;
						}
					
						// Evacuate before removing
						controller.isIn( substate ) && controller.change( this, { forced: true } );
					
						delete substates[ stateName ];
						delete this[ stateName ];
						controller.defaultState() === this && delete controller[ stateName ];
					
						return substate;
					}
				};
			},
			
			/**
			 * 
			 */
			transition: function ( transitions ) {
				return function ( transitionName ) {
					return transitions[ transitionName ];
				};
			},
			
			/**
			 * 
			 */
			transitions: function ( transitions ) {
				return function () {
					return extend( true, {}, transitions );
					// var i, result = [];
					// for ( i in transitions ) {
					// 	result.push( transitions[i] );
					// }
					// return result;
				};
			},
			
			/**
			 * 
			 */
			addTransition: function ( transitions ) {
				return function ( /*String*/ transitionName, /*StateTransitionDefinition | Object*/ transitionDefinition ) {
					transitionDefinition instanceof State.Transition.Definition ||
						( transitionDefinition = State.Transition.Definition( transitionDefinition ) );
					return transitions[ transitionName ] = transitionDefinition;
				};
			},
			
			/**
			 * Attempts to cleanly destroy this state and all of its substates. A 'destroy' event is issued
			 * to each state after it is destroyed.
			 */
			destroy: function ( setSuperstate, setDestroyed, methods, substates ) {
				return function () {
					var	superstate = this.superstate(),
						controller = this.controller(),
						owner = controller.owner(),
						transition = controller.transition(),
						origin, destination, methodName, method, stateName;
					
					if ( transition ) {
						origin = transition.origin();
						destination = transition.destination();
						if (
							this === origin || this.isSuperstateOf( origin )
								||
							this === destination || this.isSuperstateOf( destination )
						) {
							// TODO: instead of failing, defer destroy() until after transition.end()
							return false;
						}
					}
					
					if ( superstate ) {
						superstate.removeSubstate( name );
					} else {
						for ( methodName in methods ) {
							// It's the default state being destroyed, so the delegates on the owner can be deleted.
							methodName in owner && delete owner[ methodName ];
							
							// A default state may have been holding methods for the owner, so it must give those back.
							if ( ( method = methods[ methodName ] ).autochthonousToOwner ) {
								delete method.autochthonous;
								delete method.autochthonousToOwner;
								owner[ methodName ] = method;
							}
						}
					}
					for ( stateName in substates ) {
						substates[ stateName ].destroy();
					}
					setSuperstate( undefined );
					setDestroyed( true );
					this.trigger( 'destroy' );
					
					return true;
				};
			}
		},
		
		prototype: {
			/**
			 * Returns this state's fully qualified name.
			 */
			toString: function () {
				return this.derivation( true ).join('.');
			},
			
			/**
			 * Gets the `StateController` to which this state belongs.
			 */
			controller: function () {
				return this.superstate().controller();
			},
			
			/**
			 * Gets the owner object to which this state's controller belongs.
			 */
			owner: function () {
				return this.controller().owner();
			},
			
			/**
			 * Gets the default state, i.e. the top-level superstate of this state.
			 */
			defaultState: function () {
				return this.controller.defaultState();
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
			 * (2) The respective superstates of both a state and its protostate will also adhere to
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
			
			/**
			 * Returns an object array of this state's superstate chain, starting after the default state
			 * and ending at `this`.
			 * 
			 * @param byName Returns a string array of the states' names, rather than references
			 */
			derivation: function ( /*Boolean*/ byName ) {
				for (
					var result = [], s, ss = this;
					( s = ss ) && ( ss = s.superstate() );
					result.unshift( byName ? s.name() || '' : s )
				);
				return result;
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
			common: function ( /*State*/ other ) {
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
			isIn: function ( state ) {
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
			 * Finds a state method and applies it in the context of the state in which it was declared, or
			 * if the implementation resides in a protostate, the corresponding `StateProxy` in the calling
			 * controller.
			 * 
			 * If the method was autochthonous, i.e. it was already defined on the owner and subsequently
			 * "swizzled" onto the default state when the controller was constructed, then its function
			 * will have been marked `autochthonous`, and the method will thereafter be called in the
			 * original context of the owner.
			 */
			apply: function ( methodName, args ) {
				var	mc = this.methodAndContext( methodName ),
					method = mc.method,
					context = mc.context;
				if ( method ) {
					method.autochthonous && ( context = this.owner() );
					return method.apply( context, args );
				}
			},
			
			/**
			 * @see apply
			 */
			call: function ( methodName ) {
				return this.apply( methodName, slice( arguments, 1 ) );
			},
			
			/**
			 * Determines whether `this` directly possesses a method named `methodName`.
			 */
			hasOwnMethod: function ( methodName ) {
				return !!this.method( methodName, false, false );
			},
			
			/**
			 * Tells the controller to change to this or the specified `state` and returns the targeted
			 * state.
			 * 
			 * Note that this method is **presumptuous**, in that it immediately returns a state, even
			 * though the transition initiated on the controller may be asynchronous and as yet
			 * incomplete.
			 */
			select: function ( /*State|String*/ state ) {
				state === undefined && ( state = this ) || state instanceof State || ( state = this.match( state ) );
				return this.controller().change( state ) && state;
			},
			
			/**
			 * Returns a `Boolean` indicating whether `this` is the controller's current state.
			 */
			isSelected: function () {
				return this.controller().current() === this;
			},
			
			pushHistory: global.history && global.history.pushState ?
				function ( title, urlBase ) {
					return global.history.pushState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
				} : noop,
			
			replaceHistory: global.history && global.history.replaceState ?
				function ( title, urlBase ) {
					return global.history.replaceState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
				} : noop,
			
			/**
			 * Returns the Boolean result of the rule function at `ruleName` defined on this state, as
			 * evaluated against `testState`, or `true` if no rule exists.
			 */
			evaluateRule: function ( /*String*/ ruleName, /*State*/ testState ) {
				var	state = this,
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					each( rule, function ( selector, value ) {
						each( selector.split(','), function ( i, expr ) {
							if ( state.match( trim( expr ), testState ) ) {
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
			match: function ( /*String*/ expr, /*State*/ testState ) {
				var	parts = expr.split('.'),
					cursor = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					cursorSubstate,
					result;
				
				if ( parts.length ) {
					each( parts, function ( i, name ) {
						if ( name === '' ) {
							cursor = cursor.superstate();
						} else if ( cursorSubstate = cursor.substate( name ) ) {
							cursor = cursorSubstate;
						} else if ( name === '*' ) {
							result = testState ? cursor === testState.superstate() : cursor.substates();
							return false;
						} else if ( name === '**' ) {
							result = testState ? cursor.isSuperstateOf( testState ) : cursor.substates( true );
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
		 * the controller's current state.
		 * 
		 * The context of autochthonous methods relocated to the default state remains bound to the owner.
		 * Otherwise, methods are executed in the context of the state in which they are declared, or if the
		 * implementation resides in a protostate, the context will be the corresponding `StateProxy` within
		 * `controller`.
		 * 
		 * @see State.addMethod
		 */
		delegate: function ( methodName, controller ) {
			function delegate () { return controller.current().apply( methodName, arguments ); }
			delegate.isDelegate = true;
			return delegate;
		},
		
		/**
		 * Reinstates the original occupant of `'State'` on the global object and returns this module's
		 * `State`.
		 */
		noConflict: function () {
			global.State = autochthon;
			return this;
		}
	}
);


State.Definition = extend( true,
	function StateDefinition ( map ) {
		var D = State.Definition;
		if ( !( this instanceof D ) ) {
			return new D( map );
		}
		extend( true, this, map instanceof D ? map : D.expand( map ) );
	}, {
		categories: [ 'data', 'methods', 'events', 'rules', 'states', 'transitions' ],
		expand: function ( map ) {
			var key, value, category,
				result = nullHash( this.categories ),
				eventTypes = invert( State.Event.types ),
				ruleTypes = invert([ 'admit', 'release' ]); // invert( State.Rule.types );
			
			for ( key in map ) {
				value = map[key];
				
				// Priority 1 : strict type match opportunity for states and transitions
				// -- allows arbitrarily keyed values of `State({})` and `State.Transition({})`
				if ( category =
					value instanceof State.Definition && 'states'
						||
					value instanceof State.Transition.Definition && 'transitions'
				){
					( result[category] || ( result[category] = {} ) )[key] = value;
				}
				
				// Priority 2 : explicitly named category
				else if ( key in result ) {
					result[key] = extend( result[key], value );
				}
				
				// Priority 3 : implicit categorization
				else {
					category = /^_*[A-Z]/.test( key ) ? 'states' :
							key in eventTypes ? 'events' :
							key in ruleTypes ? 'rules' :
							'methods';
					( result[category] || ( result[category] = {} ) )[key] = value;
				}
			}
			
			each( result.events, function ( type, value ) {
				isFunction( value ) && ( result.events[type] = value = [ value ] );
			});
			
			each( result.transitions, function ( name, map ) {
				result.transitions[name] = map instanceof State.Transition.Definition ? map : State.Transition.Definition( map );
			});
			
			each( result.states, function ( name, map ) {
				result.states[name] = map instanceof State.Definition ? map : State.Definition( map );
			});
			
			return result;
		}
	}
);


State.Controller = extend( true,
	function StateController ( owner, name, definition, options ) {
		if ( !( this instanceof State.Controller ) ) {
			return new State.Controller( owner, name, definition, options );
		}
		
		var	defaultState, currentState, transition, getName,
			self = this,
			privileged = State.Controller.privileged,
			args = mapOverloads( arguments, this.constructor.overloads );
		
		function getName () { return name; }
		function setCurrentState ( value ) { return currentState = value; }
		function setTransition ( value ) { return transition = value; }
		
		// Rewrites for overloaded arguments
		( owner = args.owner || {} )[ name = args.name || 'state' ] = this;
		definition = args.definition instanceof State.Definition ? args.definition : State.Definition( args.definition );
		typeof ( options = args.options || {} ) === 'string' && ( options = { initialState: options } );
		
		// Expose these in debug mode
		debug && extend( this.__private__ = {}, {
			defaultState: defaultState,
			owner: owner,
			options: options
		});
		
		extend( this, {
			owner: function () { return owner; },
			name: getName.toString = getName,
			defaultState: function () { return defaultState; },
			current: extend( function () { return currentState; }, {
				toString: function () { return currentState.toString(); }
			}),
			transition: extend( function () { return transition; }, {
				toString: function () { return transition ? transition.toString() : ''; }
			})
		});
		
		indirect( this, State.Controller.privileged, {
			'change' : [ setCurrentState, setTransition ]
		});
		
		// Instantiate the default state and initialize it as the root of the state hierarchy
		( defaultState = extend( new State(), {
			controller: function () { return self; }
		}) ).init( definition );
		
		currentState = options.initialState ? defaultState.match( options.initialState ) : defaultState;
		currentState.controller() === this || ( currentState = this.createProxy( currentState ) );
	}, {
		overloads: {
			'object string object object' : 'owner name definition options',
			'object string object string' : 'owner name definition options',
			'object string object' : 'owner name definition',
			'object object object' : 'owner definition options',
			'object object string' : 'owner definition options',
			'string object object' : 'name definition options',
			'string object string' : 'name definition options',
			'object object' : 'owner definition',
			'string object' : 'name definition',
			'object string' : 'definition options',
			'object' : 'definition',
			'string' : 'name'
		},
		privileged: {
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
			 * @see State.Controller.change
			 */
			change: function ( setCurrentState, setTransition ) {
				return function ( destination, options ) {
					var	destinationOwner, source, origin, domain, info, state,
						owner = this.owner(),
						transition = this.transition(),
						transitionDefinition,
						self = this;
				
					// Translate `destination` argument to a proper `State` object if necessary.
					destination instanceof State || ( destination = destination ? this.get( destination ) : this.defaultState() );
				
					if ( !destination ||
							( destinationOwner = destination.owner() ) !== owner &&
							!destinationOwner.isPrototypeOf( owner )
					) {
						throw new Error( "StateController: attempted a change to an invalid state" );
					}
				
					options || ( options = {} );
					origin = transition ? transition.origin() : this.current();
					if ( options.forced ||
							origin.evaluateRule( 'release', destination ) &&
							destination.evaluateRule( 'admit', origin )
					) {
						/*
						 * If `destination` is a state from a prototype of `owner`, it must be represented here as a
						 * transient protostate proxy.
						 */
						destination && destination.controller() !== this && ( destination = this.createProxy( destination ) );
						
						// If a transition is underway, it needs to be notified that it won't finish.
						transition && transition.abort();
						
						source = state = this.current();
						domain = source.common( destination );
						
						/*
						 * Retrieve the appropriate transition definition for this origin/destination pairing;
						 * if none is defined then a default transition is created that will cause the callback
						 * to return immediately.
						 */
						transition = setTransition( new State.Transition(
							destination,
							source,
							transitionDefinition = this.getTransitionDefinitionFor( destination, origin )
						));
						info = { transition: transition, forced: !!options.forced };
						
						/*
						 * Walk up to the top of the domain, beginning with a 'depart' event, and bubbling 'exit'
						 * events at each step along the way.
						 */
						source.trigger( 'depart', info );
						setCurrentState( transition );
						transition.trigger( 'enter' );
						while ( state !== domain ) {
							state.trigger( 'exit', info );
							transition.attachTo( state = state.superstate() );
						}
						
						/*
						 * Provide an enclosed callback that will be called from `transition.end()` to conclude the
						 * `change` operation.
						 */
						transition.setCallback( function () {
							var pathToState = [];
							
							/*
							 * Trace a path from `destination` up to `domain`, then walk down it, capturing 'enter'
							 * events along the way, and terminating with an 'arrive' event.
							 */
							for ( state = destination; state !== domain; pathToState.push( state ), state = state.superstate() );
							while ( pathToState.length ) {
								transition.attachTo( state = pathToState.pop() );
								state.trigger( 'enter', info );
							}
							transition.trigger( 'exit' );
							setCurrentState( destination );
							this.current().trigger( 'arrive', info );
							
							origin instanceof State.Proxy && ( this.destroyProxy( origin ), origin = null );
							transition.destroy(), transition = setTransition( null );
							
							typeof options.success === 'function' && options.success.call( this );
							return this;
						});
						
						transition.start.apply( transition, options.arguments );
						return this;
					} else {
						typeof options.failure === 'function' && options.failure.call( this );
						return false;
					}
				}
			},
		},
		prototype: {
			toString: function () {
				return this.current().toString();
			},
			match: function ( expr, testState ) {
				return this.current().match( expr, testState );
			},
			get: function ( expr, context ) {
				return expr === undefined ? this.current() : ( context || this ).match( expr );
			},
			is: function ( expr, context ) {
				return ( expr instanceof State ? expr : this.get( expr, context ) ) === this.current();
			},
			isIn: function ( expr, context ) {
				return this.current().isIn( expr instanceof State ? expr : this.get( expr, context ) );
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
			 * Finds the appropriate transition definition for the given origin and destination states. If no
			 * matching transitions are defined in any of the states, returns a generic transition definition
			 * for the origin/destination pair with no `operation`.
			 */
			getTransitionDefinitionFor: function ( destination, origin ) { //// untested
				origin || ( origin = this.current() );
				
				function search ( state, until ) {
					var result;
					for ( ; state && state !== until; state = until ? state.superstate() : undefined ) {
						each( state.transitions(), function ( i, definition ) {
							return !(
								( definition.destination ? state.match( definition.destination, destination ) : state === destination ) &&
								( !definition.origin || state.match( definition.origin, origin ) ) &&
							( result = definition ) );
						});
					}
					return result;
				}
				
				// Search order: (1) `destination`, (2) `origin`, (3) superstates of `destination`, (4) superstates of `origin`
				return (
					search( destination ) ||
					origin !== destination && search( origin ) ||
					search( destination.superstate(), this.defaultState() ) || search( this.defaultState() ) ||
					!destination.isIn( origin ) && search( origin.superstate(), origin.common( destination ) ) ||
					new State.Transition.Definition()
				);
			},
			
			addState: function ( stateName, stateDefinition ) {
				return this.defaultState().addSubstate( stateName, stateDefinition );
			},
			
			removeState: function ( stateName ) {
				return this.defaultState().removeSubstate( stateName );
			},
			
			method: function ( methodName ) {
				return this.current().method( methodName );
			},
			
			superstate: function ( methodName ) {
				var superstate = this.current().superstate();
				return methodName === undefined ? superstate : superstate.method( methodName );
			},
			
			destroy: function () {
				return this.defaultState().destroy() && delete this.owner()[ this.name() ];
			}
		}
	}
);


State.Event = extend( true,
	function StateEvent ( state, type ) {
		extend( this, {
			target: state,
			name: state.name,
			type: type
		});
	}, {
		types: [ 'construct', 'destroy', 'depart', 'exit', 'enter', 'arrive', 'mutate' ],
		prototype: {
			toString: function () {
				return 'StateEvent (' + this.type + ') ' + this.name;
			},
			log: function ( text ) {
				console && console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
			}
		},
		Collection: extend( true,
			function StateEventCollection ( state, type ) {
				var	items = {},
					length = 0,
					getLength = ( getLength = function () { return length; } ).toString = getLength;
					
				extend( this, {
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
							items[i].apply( state, [ extend( new State.Event( state, type ), data ) ] );
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
State.Proxy = extend( true,
	function StateProxy ( superstate, name ) {
		var	getName;
		extend( this, {
			superstate: function () { return superstate; },
			name: ( getName = function () { return name || ''; } ).toString = getName,
			
			// State may invalidate this proxy if state gets destroyed or removed
			invalidate: function () {
				// tell controller to eject itself
			}
		});
	}, {
		prototype: extend( true, new State(), {
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

State.Transition = extend( true,
	function StateTransition ( destination, source, definition, callback ) {
		if ( !( this instanceof State.Transition ) ) {
			return State.Transition.Definition.apply( this, arguments );
		}
		
		// definition instanceof State.Transition.Definition || ( definition = new State.Transition.Definition( definition ) );
		
		var	methods = {},
			events = nullHash( State.Transition.Event.types ),
			operation = definition.operation,
			self = this,
			attachment = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			aborted;
		
		function setDefinition ( value ) { return definition = value; }
		
		// expose these in debug mode
		debug && extend( this.__private__ = {}, {
			methods: methods,
			events: events,
			operation: operation
		});
		
		extend( this, {
			/**
			 * Even though StateTransition inherits `superstate` from State, it requires its own implementation,
			 * which is used here to track its position as it walks the State subtree domain.
			 */
			superstate: function () { return attachment; },
			
			attachTo: function ( state ) { attachment = state; },
			controller: function () { return controller; },
			definition: function () { return definition; },
			origin: function () { return source instanceof State.Transition ? source.origin() : source; },
			source: function () { return source; },
			destination: function () { return destination; },
			setCallback: function ( fn ) { callback = fn; },
			aborted: function () { return aborted; },
			start: function () {
				aborted = false;
				this.trigger( 'start' );
				isFunction( operation ) ? operation.apply( this, arguments ) : this.end();
			},
			abort: function () {
				aborted = true;
				callback = null;
				this.trigger( 'abort' );
				return this;
			},
			end: function ( delay ) {
				if ( delay ) {
					return setTimeout( function () { self.end(); }, delay );
				}
				if ( !aborted ) {
					this.trigger( 'end' );
					callback && callback.apply( controller );
				}
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = attachment = controller = null;
			}
		});
		
		indirect( this, State.privileged, {
			'init' : [ State.Transition.Definition, setDefinition ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event events addEvent removeEvent trigger' : [ events ],
		});
		
		this.init();
	}, {
		prototype: extend( true, new State(), {
			depth: function () {
				for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
				return count;
			}
		}),
		
		Event: {
			types: [ 'construct', 'destroy', 'enter', 'exit', 'start', 'end', 'abort' ]
		},
		
		Definition: extend( true,
			function StateTransitionDefinition ( map ) {
				var D = State.Transition.Definition;
				if ( !( this instanceof D ) ) {
					return new D( map );
				}
				extend( true, this, map instanceof D ? map : D.expand( map ) );
			}, {
				properties: [ 'origin', 'source', 'destination', 'operation' ],
				categories: [ 'methods', 'events' ],
				expand: function ( map ) {
					var	properties = nullHash( this.properties ),
						categories = nullHash( this.categories ),
						result = extend( {}, properties, categories ),
						eventTypes = invert( State.Transition.Event.types ),
						key, value, category;
					for ( key in map ) {
						value = map[key];
						if ( key in properties ) {
							result[key] = value;
						}
						else if ( key in categories ) {
							extend( result[key], value );
						}
						else {
							category = key in eventTypes ? 'events' : 'methods';
							( result[category] || ( result[category] = {} ) )[key] = value;
						}
					}
					each( result.events, function ( type, value ) {
						isFunction( value ) && ( result.events[type] = value = [ value ] );
					});
					return result;
				}
			}
		)
	}
);


// exposes everything on one place on the global object
( typeof exports !== 'undefined' ? exports :
	// typeof module !== 'undefined' ? module.exports : 
	global ).State = State;

})();

