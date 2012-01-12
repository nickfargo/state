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
 */

var	toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty,
	trim = String.prototype.trim ?
		function ( text ) { return text == null ? '' : String.prototype.trim.call( text ); }:
		function ( text ) { return text == null ? '' : text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' ); },
	slice = Array.prototype.slice;

/**
 * Calls the specified native function if it exists and returns its result; if no such function exists on
 * `obj` as registered in `__native.fn`, returns our unique `noop` (as opposed to `null` or `undefined`,
 * which may be a valid result from the native function itself).
 */
function __native ( item, obj /* , ... */ ) {
	var n = __native.fn[item];
	return n && obj[item] === n ? n.apply( obj, slice.call( arguments, 2 ) ) : noop;
}
__native.fn = {
	forEach: Array.prototype.forEach
};

/**
 * General-purpose empty function; also usable as a unique alternative "nil" type in strict-equal matches
 * whenever it's desirable to avoid traditional `null` and `undefined`.
 */
function noop () {}

/** Similar purpose to `noop` */
function getThis () { return this; }

/** Safer alternative to `typeof` operator */
function type ( obj ) {
	return obj == null ? String( obj ) : type.map[ toString.call( obj ) ] || 'object';
}
type.map = {};
each( 'Array Boolean Date Function Number Object RegExp String'.split(' '), function( i, name ) {
	type.map[ "[object " + name + "]" ] = name.toLowerCase();
});

/** isNumber */
function isNumber ( n ) { return !isNaN( parseFloat( n ) && isFinite( n ) ); }

/** isArray */
function isArray ( obj ) { return type( obj ) === 'array'; }

/** isFunction */
function isFunction ( obj ) { return type( obj ) === 'function'; }

/** isPlainObject */
function isPlainObject ( obj ) {
	if ( !obj || type( obj ) !== 'object' || obj.nodeType || obj === global ||
		obj.constructor &&
		!hasOwn.call( obj, 'constructor' ) &&
		!hasOwn.call( obj.constructor.prototype, 'isPrototypeOf' )
	) {
		return false;
	}
	for ( var key in obj ) {}
	return key === undefined || hasOwn.call( obj, key );
}

/** isEmpty */
function isEmpty ( obj, andPrototype ) {
	if ( isArray( obj ) && obj.length ) {
		return false;
	}
	for ( var key in obj ) {
		if ( andPrototype || hasOwn.call( obj, key ) ) {
			return false;
		}
	}
	return true;
}

/** extend */
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

				// 
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
	var	key, i, l = obj.length;
	if ( l === undefined || isFunction( obj ) ) {
		for ( key in obj ) {
			if ( fn.call( obj[key], key, obj[key], obj ) === false ) {
				break;
			}
		}
	} else {
		for ( i = 0, l = obj.length; i < l; ) {
			if ( fn.call( obj[i], i, obj[i++], obj ) === false ) {
				break;
			}
		}
	}
	return obj;
}

function forEach ( obj, fn, context ) {
	var	n, l, key, i;
	if ( obj == null ) return;
	if ( ( n = __native( 'forEach', obj, fn, context ) ) !== noop ) return n;
	if ( ( l = obj.length ) === undefined || isFunction( obj ) ) {
		for ( key in obj ) {
			if ( fn.call( context || obj[key], obj[key], key, obj ) === false ) {
				break;
			}
		}
	} else {
		for ( i = 0, l = obj.length; i < l; ) {
			if ( fn.call( context || obj[i], obj[i], i++, obj ) === false ) {
				break;
			}
		}
	}
	return obj;
}

/**
 * Extracts elements of nested arrays and deposits them into a single flat array
 */
function flatten ( array ) {
	isArray( array ) || ( array = [ array ] );
	var	i = 0,
		l = array.length,
		item,
		result = [];
	while ( i < l ) {
		item = array[i++];
		isArray( item ) ? ( result = result.concat( flatten( item ) ) ) : result.push( item );
	}
	return result;
}

/**
 * Returns an array containing the keys of a hashmap
 */
function keys ( obj ) {
	var key, result = [];
	for ( key in obj ) if ( hasOwn.call( obj, key ) ) {
		result.push( key );
	}
	return result;
}

/**
 * Returns a hashmap that is the key-value inversion of the supplied string array
 */
function invert ( array ) {
	for ( var i = 0, l = array.length, map = {}; i < l; ) {
		map[ array[i] ] = i++;
	}
	return map;
}

/**
 * Sets all of an object's values to a specified value
 */
function setAll ( obj, value ) {
	for ( var i in obj ) if ( hasOwn.call( obj, i ) ) {
		obj[i] = value;
	}
	return obj;
}

/**
 * Produces a hashmap whose keys are the supplied string array, with values all set to `null`
 */
function nullHash( keys ) { return setAll( invert( keys ), null ); }

/**
 * Rigs partially applied functions, obtained from `functionSource`, as methods on a `object`. This
 * facilitates implementation of reusable privileged methods by abstracting the "privileged" subset
 * of variables available to the method into another level of scope. Because of this separation, the
 * actual logic portion of the method can then be used by other objects ("subclasses" and the like),
 * whose constructors can simply call this function themselves with their own private free variables.
 * 
 * Functions supplied by `functionSource` accept the set of closed variables as arguments, and return
 * a function that will become the `object`'s method.
 * 
 * The `map` argument maps a space-delimited set of method names to an array of free variables. These
 * variables are passed as arguments to each of the named methods as found within `functionSource`.
 */
function constructPrivilegedMethods ( object, functionSource, map ) {
	each( map, function ( names, args ) {
		each( names.split(' '), function ( i, methodName ) {
			var method = functionSource[ methodName ].apply( undefined, args );
			object[ methodName ] = function () { return method.apply( this, arguments ); };
		});
	});
	return object;
}

/**
 * Transforms an array of `args` into a map of named arguments, based on the position and type of
 * each item within `args`. This is directed by `map`, wherein each item maps a space-delimited
 * type sequence (e.g., "object array string") to an equal number of space-delimited argument names.
 */
function overload ( args, map ) {
	var	i, l,
		types = [],
		names,
		result = {};
	for ( i = 0, l = args.length; i < l; i++ ) {
		if ( args[i] === undefined ) { break; }
		types.push( type( args[i] ) );
	}
	if ( types.length && ( types = types.join(' ') ) in map ) {
		names = map[ types ].split(' ');
		for ( i = 0, l = names.length; i < l; i++ ) {
			result[ names[i] ] = args[i];
		}
	}
	return result;
}

function excise ( deep, target ) { //// untested
	var	args = slice.call( arguments ),
		i, key, value, obj,
		delta = {};
	deep === !!deep && args.shift();
	target = args[0];
	for ( i = args.length; --i; ) {
		obj = args[i];
		for ( key in obj ) if ( hasOwn.call( value = obj[key] ) ) {
			if ( deep && isPlainObject( value ) ) {
				delta[key] = excise( target[key], value );
			} else if ( value != null ) {
				delta[key] = target[key];
				delete target[key];
			}
			// deep && isPlainObject( obj[key] ) && ( delta[key] = excise( target[key], obj[key] ) ) ||
			// !!obj[key] && ( delta[key] = target[key], delete target[key] );
		}
	}
	return delta;
}

/**
`Deferral` is a stateful callback device used to manage the eventualities of asynchronous operations.

@param Object map : Hashmap whose entries represent the set of resolved substates for the deferral;
		keys specify a name for the substate's callback queue, and values specify a name for the
		resolution method used to transition to that substate and execute its associated callbacks.
@param Function fn : A function that will be executed immediately in the context of the deferral.
@param Array args : Array of arguments to be passed to `fn`.
 */
function Deferral ( map, fn, args ) {
	if ( !( this instanceof Deferral ) ) {
		return new Deferral( map, fn, args );
	}
	if ( map == null || isFunction( map ) ) {
		return new Deferral.Binary( arguments[0], arguments[1] );
	}
	
	var	self = this,
		callbacks,
		resolution, resolutionContext, resolutionArguments,
		register, resolve,
		promise;
	
	function setResolution ( name ) { return name in map && ( resolution = name ); }
	function getResolutionContext () { return resolutionContext; }
	function getResolutionArguments () { return resolutionArguments; }
	function setResolutionArguments ( args ) { return resolutionArguments = args; }
	
	extend( this, {
		empty: function () {
			callbacks = {};
			each( map, function ( key ) { callbacks[ key ] = []; });
			return this;
		},
		map: function () { return extend( {}, map ); },
		queueNames: function () { return keys( map ); },
		resolution: function ( test ) {
			return test ? test === resolution || ( test in map ? false : undefined ) : resolution;
		},
		did: function ( resolver ) {
			return resolver ? !!resolution && resolver === map[ resolution ] : !!resolution;
		},
		promise: function () {
			return promise || ( promise = new Promise( this ) );
		},
		as: function ( context ) {
			resolutionContext = context;
			return this;
		},
		given: function ( args ) {
			resolutionArguments = args;
			return this;
		}
	});
	this.queueNames.toString = function () { return self.queueNames().join(' ') };
	this.resolution.toString = this.resolution;
	
	this.empty();
	register = Deferral.privileged.register( callbacks );
	resolve = Deferral.privileged.resolve(
		callbacks, setResolution, getResolutionContext, getResolutionArguments, setResolutionArguments
	);
	
	each( map, function ( name, resolver ) {
		self[ name ] = register( name );
		self[ resolver ] = resolve( name );
	});
	
	register = resolve = null;
	
	fn && isFunction( fn ) && fn.apply( this, args );
}
extend( true, Deferral, {
	privileged: {
		/**
		 * Produces a function that pushes callbacks onto one of the callback queues.
		 */
		register: function ( callbacks ) {
			return function ( resolution ) { // e.g. { 'yes' | 'no' }
				return function ( fn ) {
					isFunction( fn ) && callbacks[ resolution ].push( fn ) ||
						isArray( fn ) && forEach( fn, this[ resolution ] );
					return this;
				};
			};
		},
		
		/**
		 * Produces a function that resolves the deferral, transitioning it to one of its resolved substates.
		 */
		resolve: function ( callbacks, setResolution, getResolutionContext, getResolutionArguments, setResolutionArguments ) {
			return function ( resolution ) {
				return function () {
					var	self = this,
						name,
						map = this.map(),
						context = getResolutionContext(),
						args = arguments.length ? setResolutionArguments( slice.call( arguments ) ) : getResolutionArguments();
					
					setResolution( resolution );
					
					/*
					 * The deferral has transitioned to a 'resolved' substate ( e.g. affirmed | negated ),
					 * so the behavior of its callback registration methods are redefined to reflect this.
					 * A closure preserves the current execution state as `context` and `args`; henceforth,
					 * callbacks that would be registered to the queue named `resolution` will instead be
					 * called immediately with the saved `context` and `args`, while subsequent callback
					 * registrations to any of the other queues are deemed invalid and will be discarded.
					 */
					this[ resolution ] = Deferral.privileged.invoke( this, callbacks )( context, args );
					this[ map[ resolution ] ] = this.as = this.given = getThis;
					delete map[ resolution ];
					for ( name in map ) {
						this[ name ] = this[ map[ name ] ] = getThis;
					}
					
					Deferral.privileged.invokeAll( this, callbacks )( context, args )( callbacks[ resolution ] );
					
					delete callbacks[ resolution ];
					for ( name in map ) { delete callbacks[ name ]; }
					
					return this;
				};
			};
		},
		
		/**
		 * Produces a function that invokes a queued callback. In addition, when the deferral is
		 * resolved, the function returned here will become the callback registration method (e.g.,
		 * 'yes' | 'no') that corresponds to the deferral's resolution, such that registering a
		 * callback after the deferral is resolved will cause the callback to be invoked immediately.
		 */
		invoke: function ( deferral, callbacks ) {
			return function ( context, args ) {
				return function ( fn ) {
					try {
						isFunction( fn ) ? fn.apply( context || deferral, args ) :
						isArray( fn ) && Deferral.privileged.invokeAll( deferral, callbacks )( context, args )( fn );
					} catch ( nothing ) {}
					return deferral;
				};
			};
		},
		
		/** Analogue of `invoke`, for an array of callbacks. */
		invokeAll: function ( deferral, callbacks ) {
			return function ( context, args ) {
				return function ( fns ) {
					var invoke = Deferral.privileged.invoke( deferral, callbacks )( context, args );
					for ( i = 0, l = fns.length; i < l; i++ ) {
						invoke( fns[i] );
					}
				};
			};
		}
	},
	prototype: {
		/**
		 * Unified interface for registering callbacks. Multiple arguments are registered to callback
		 * queues in respective order; e.g. `Deferral().then( fn1, fn2 )` registers `fn1` to the
		 * first queue (`yes`) and `fn2` to the second queue (`no`).
		 */
		then: function () {
			var map = keys( this.map() ), i = 0, l = Math.min( map.length, arguments.length );
			while ( i < l ) { this[ map[i] ]( arguments[ i++ ] ); }
			return this;
		},
		
		/**
		 * Interface for adding callbacks that will execute once the deferral is resolved, regardless of
		 * whether it is affirmed or not.
		 */
		always: function () {
			var name, map = this.map(), fns = slice.call( arguments );
			for ( name in map ) { this[ name ]( fns ); }
			return this;
		},
		
		/**
		 * Registers callbacks to a separate deferral, whose resolver methods are registered to the
		 * queues of this deferral, and returns a promise bound to the succeeding deferral. This
		 * arrangement forms a pipeline structure, which can be extended indefinitely with chained
		 * calls to `pipe`. Once resolved, the original deferral (`this`) passes its resolution
		 * state, context and arguments on to the succeeding deferral, whose callbacks may then
		 * likewise dictate the resolution parameters of a further `pipe`d deferral, and so on.
		 * 
		 * Synchronous callbacks that return immediately will cause the succeeding deferral to
		 * resolve immediately, with the same resolution state and context from its receiving
		 * deferral, and the callback's return value as its lone resolution argument. Asynchronous
		 * callbacks that return their own promise or deferral will cause the succeeding deferral
		 * to resolve similarly once the callback's own deferral is resolved.
		 */
		pipe: function () {
			var	self = this,
				map = this.map(),
				key, resolver, fn,
				i = 0, l = arguments.length,
				next = new Deferral( map );
			for ( key in map ) {
				if ( i < l ) {
					resolver = map[ key ];
					fn = arguments[ i++ ];
					this[ key ](
						isFunction( fn ) ?
							function () {
								var key,
									result = fn.apply( this, arguments ),
									promise = result && Promise.resembles( result ) ?
										result.promise() : undefined;
								if ( promise ) {
									for ( key in map ) {
										promise[ key ]( next[ map[ key ] ] );
									}
								} else {
									next.as( this === self ? next : this )[ resolver ]( result );
								}
							} :
							next[ resolver ]
					);
				} else break;
			}
			return next.promise();
		}
	}
});


function UnaryDeferral ( fn, args ) {
	if ( !( this instanceof UnaryDeferral ) ) { return new UnaryDeferral( fn, args ); }
	Deferral.call( this, { done: 'resolve' }, fn, args );
}
UnaryDeferral.prototype = Deferral.prototype;
Deferral.Unary = UnaryDeferral;


function BinaryDeferral ( fn, args ) {
	if ( !( this instanceof BinaryDeferral ) ) { return new BinaryDeferral( fn, args ); }
	Deferral.call( this, { yes: 'affirm', no: 'negate' }, fn, args );
}
BinaryDeferral.prototype = Deferral.prototype;
Deferral.Binary = BinaryDeferral;

/**
 * `Promise` is a limited interface into a `Deferral` instance, consisting of a particular subset of
 * the deferral's methods. Consumers of the promise are prevented from affecting the represented
 * deferral's resolution state, but they can use it to query its state and add callbacks.
 */
function Promise ( deferral ) {
	var self = this,
		list = Promise.methods.concat( deferral.queueNames() ),
		i = list.length;
	while ( i-- ) {
		( function ( name ) {
			self[ name ] = function () {
				var result = deferral[ name ].apply( deferral, arguments );
				return result === deferral ? self : result;
			};
		})( list[i] );
	}
	this.serves = function ( master ) { return master === deferral; };
}
extend( true, Promise, {
	methods: 'then always pipe promise did resolution map queueNames'.split(' '),
	
	// Used to test whether an object is or might be able to act as a Promise.
	resembles: function ( obj ) {
		return obj && (
			obj instanceof Promise ||
			obj instanceof Deferral ||
			isFunction( obj.then ) && isFunction( obj.promise )
		);
	}
});


function Queue ( operations ) {
	if ( !( this instanceof Queue ) ) {
		return new Queue( operations );
	}
	
	var	self = this,
		queue = slice.call( operations ),
		operation,
		args,
		deferral,
		running = false,
		pausePending = false;
	
	function continuation () {
		var result;
		if ( isFunction( this ) ) {
			result = this.apply( self, arguments );
			if ( Promise.resembles( result ) ) {
				result.then(
					function () {
						args = slice.call( arguments );
						pausePending && ( running = pausePending = false );
						running && continuation.apply( operation = queue.shift(), args );
					},
					function () {
						deferral.as( self ).negate.apply( deferral, args );
					}
				);
			} else {
				args = slice.call( arguments );
				running && continuation.apply( operation = queue.shift(), isArray( result ) ? result : [ result ] );
			}
		} else {
			deferral.as( self.stop() ).affirm.apply( deferral, arguments );
		}
	}
	function start () {
		deferral = new Deferral;
		running = true;
		this.start = getThis, this.pause = pause, this.resume = resume, this.stop = stop;
		continuation.apply( operation = queue.shift(), args = slice.call( arguments ) );
		return this;
	}
	function pause () {
		pausePending = true;
		this.resume = resume, this.pause = getThis;
		return this;
	}
	function resume () {
		running = true, pausePending = false;
		this.pause = pause, this.resume = getThis;
		continuation.apply( operation = queue.shift(), args );
		return this;
	}
	function stop () {
		running = pausePending = false;
		this.start = start, this.pause = this.resume = this.stop = getThis;
		return this;
	}
	
	forEach( 'push pop shift unshift reverse splice'.split(' '), function ( method ) {
		self[ method ] = function () {
			return Array.prototype[ method ].apply( queue, arguments );
		};
	});
	
	extend( this, {
		length: ( function () {
			function f () { return queue.length; }
			return ( f.valueOf = f );
		})(),
		promise: function () {
			return deferral.promise();
		},
		operation: function () { return operation; },
		args: function () { return slice.call( args ); },
		start: start,
		pause: getThis,
		resume: getThis,
		stop: getThis,
		isRunning: ( function () {
			function f () { return running; }
			return ( f.valueOf = f );
		})()
	});
}


/**
 * Binds together the fate of all `promises` as evaluated against the specified `resolution`. Returns a
 * `Promise` to a master `Deferral` that either: (1) will resolve to `yes` once all `promises` have
 * individually been resolved to the specified `resolution`; or (2) will resolve to `no` once any one of the
 * `promises` has been resolved to a different resolution. If no `resolution` is specified, it will default
 * to that of the first defined callback queue (e.g. `yes` for a standard deferral).
 */
function when ( /* promises..., [ resolution ] */ ) {
	var	promises = flatten( slice.call( arguments ) ),
		length = promises.length || 1,
		resolution,
		master = new Deferral,
		list = [],
		i, promise, affirmativeQueue, map, name;
	
	function affirmed ( p ) {
		return function () {
			list.push( p ) === length && master.affirm.apply( master, list );
		};
	}
	function negated ( p ) {
		return function () {
			list.push( p );
			master.negate.apply( master, list );
		};
	}
	
	if ( length > 1 && type( promises[ length - 1 ] ) === 'string' ) {
		resolution = promises.splice( --length, 1 )[0];
	}
	
	for ( i = 0; i < length; i++ ) {
		promise = promises[i];
		if ( promise instanceof Deferral || promise instanceof Promise ) {
			
			// Determine which of this promise's callback queues matches the specified `resolution`
			affirmativeQueue = resolution || promise.queueNames()[0];
			
			// `map` becomes a list referencing the callback queues not considered affirmative in this context
			map = promise.map();
			if ( affirmativeQueue in map ) {
				delete map[ affirmativeQueue ];
			} else {
				// Because this promise will never be resolved to match `resolution`, the master deferral
				// can be negated immediately
				list.push( promise );
				master.negate.apply( master, list );
				break;
			}
			
			promise[ affirmativeQueue ]( affirmed( promise ) );
			for ( name in map ) {
				promise[ name ]( negated( promise ) );
			}
		}
		
		// For foreign promise objects, we utilize the standard `then` interface
		else if ( Promise.resembles( promise ) ) {
			promise.then( affirmed( promise ), negated( promise ) );
		}
		
		// For anything that isn't promise-like, force whatever `promise` is to play nice with the
		// other promises by wrapping it in an immediately affirmed deferral.
		else {
			promises[i] = ( isFunction( promise ) ? new Deferral( promise ) : new Deferral )
				.as( master ).affirm( promise );
		}
	}
	
	return master.promise();
}


/**
 * # State
 */

/**
 * Constructor for `State` typed objects, as well as the root namespace.
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
		guards = {},
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
		guards: guards,
		substates: substates,
		transitions: transitions
	});
	
	/**
	 * Get the state's name. Copying the function to its own `toString` exposes the value of `name`
	 * when the method is viewed in the Chrome web inspector.
	 */
	( this.name = function () { return name || ''; } ).toString = this.name;
	
	/** Get the `StateDefinition` that was used to define this state. */
	this.definition = function () { return definition; };
	
	/*
	 * External privileged methods
	 * 
	 * Method names are mapped to specific internal free variables. The named methods are created on
	 * `this`, each of which is partially applied with its mapped free variables to the correspondingly
	 * named methods at `State.privileged`.
	 */
	constructPrivilegedMethods( this, State.privileged, {
		'init' : [ State.Definition, setDefinition ],
		'superstate' : [ superstate ],
		'data' : [ data ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events on addEvent removeEvent emit trigger' : [ events ],
		'guard addGuard removeGuard' : [ guards ],
		'substate substates addSubstate removeSubstate' : [ substates ],
		'transition transitions addTransition' : [ transitions ],
		'destroy' : [ setSuperstate, setDestroyed, methods, substates ]
	});
	
	/*
	 * If no superstate, e.g. a default state being created by a `StateController`, then `init()` must be
	 * called later by the implementor.
	 */
	superstate && this.init();
}

/*
 * Privileged indirections, partially applied with private free variables from inside the `State` constructor.
 */
State.privileged = new function () {
	extend( this, {
		/**
		 * Builds out the state's members based on the contents of the supplied definition.
		 */
		init: function ( /*Function*/ DefinitionConstructor, /*Function*/ setDefinition ) {
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
						var i, l;
						isArray( fn ) || ( fn = [ fn ] );
						for ( i = 0, l = fn.length; i < l; i++ ) {
							self.addEvent( eventType, fn[i] );
						}
					},
					guards: function ( guardType, guard ) {
						self.addGuard( guardType, guard );
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
		
				this.emit( 'construct', { definition: definition } );
		
				return this;
			};
		},

		superstate: function ( /*State*/ superstate ) {
			/**
			 * Returns the immediate superstate, or the nearest state in the superstate chain with the
			 * provided `stateName`.
			 */
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

		data: function ( /*Object*/ data ) {
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
			return function ( /*Object*/ edit, /*Boolean*/ isDeletion ) {
				var viaSuper, viaProto, key, superstate, protostate;
	
				// If first argument is a Boolean, interpret method call as a "get" with inheritance flags.
				typeof edit === 'boolean' && ( viaSuper = edit, viaProto = isDeletion, edit = false );
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
	
				if ( edit ) { // set
					( isDeletion ?
						!isEmpty( data ) && !isEmpty( edit ) && excise( true, data, edit )
						:
						isEmpty( edit ) || extend( true, data, edit )
					) &&
						this.emit( 'mutate', { edit: edit, isDeletion: isDeletion } );
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

		method: function ( methods ) {
			/**
			 * Retrieves the named method held on this state. If no method is found, step through this state's
			 * protostate chain to find one. If no method is found there, step up the superstate hierarchy
			 * and repeat the search.
			 */
			return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
				var	superstate, protostate,
					method = methods[ methodName ];
				
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
				
				return (
					method !== noop && method
						||
					viaProto && ( protostate = this.protostate() ) && protostate.method( methodName, false, true )
						||
					viaSuper && ( superstate = this.superstate() ) && superstate.method( methodName, true, viaProto )
						||
					method
				);
			};
		},

		methodAndContext: function ( methods ) {
			/**
			 * Returns the product of `method()` along with its context, i.e. the State that will be
			 * referenced by `this` within the function.
			 */
			return function ( methodName, /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
				var	superstate, protostate,
					method = methods[ methodName ],
					result = {};
		
				viaSuper === undefined && ( viaSuper = true );
				viaProto === undefined && ( viaProto = true );
		
				return (
					( result.method = method ) && method !== noop && ( result.context = this, result )
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

		methodNames: function ( methods ) {
			/** Returns an `Array` of names of methods defined for this state. */
			return function () {
				return keys( methods );
			};
		},

		addMethod: function ( methods ) {
			/**
			 * Adds a method to this state, which will be callable directly from the owner, but with its
			 * context bound to the state.
			 */
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
							ownerMethod.autochthonousToOwner = hasOwn.call( owner, methodName );
						} else {
							/*
							 * Otherwise, since the method being added has no counterpart on the owner, a
							 * no-op is placed on the default state instead. Consequently the added method
							 * may be called no matter which state the controller is in, though it 
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

		removeMethod: function ( methods ) {
			/** Dissociates the named method from this state object and returns its function. */
			return function ( /*String*/ methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			};
		},

		event: function ( events ) {
			/** Gets a registered event handler. */
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].get( id );
			};
		},

		events: function ( events ) {
			/** Gets an `Array` of all event handlers registered for the specified `eventType`. */
			return function ( /*String*/ eventType ) {
				return events[ eventType ];
			};
		},

		addEvent: function ( events ) {
			/**
			 * Binds an event handler to the specified `eventType` and returns a unique identifier for the
			 * handler. Recognized event types are listed at `State.Event.types`.
			 * @see State.Event
			 */
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
	
		removeEvent: function ( events ) {
			/**
			 * Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
			 * @see State.addEvent
			 */
			return function ( /*String*/ eventType, /*String*/ id ) {
				return events[ eventType ].remove( id );
			};
		},

		emit: function ( events ) {
			/** Used internally to invoke an event type's handlers at the appropriate time. */
			return function ( /*String*/ eventType, /*Object*/ data ) {
				var e;
				return eventType in events && ( e = events[ eventType ] ) && e.emit( data ) && this;
			};
		},

		guard: function ( guards ) {
			/**
			 * Gets a guard object for this state. Guards are inherited from protostates, but not from
			 * superstates.
			 */
			return function ( /*String*/ guardType ) {
				var protostate;
				return (
					guards[ guardType ]
						||
					( protostate = this.protostate() ) && protostate.guard( guardType )
					 	||
					undefined
				);
			};
		},

		addGuard: function ( guards ) {
			/** Adds a guard to the state. */
			return function ( /*String*/ guardType, guard ) {
				guards[ guardType ] = guard;
			};
		},

		removeGuard: function ( guards ) {
			/** */
			return function ( /*String*/ guardType, /*String*/ guardKey ) {
				throw new Error( "Not implemented" );
			};
		},

		substate: function ( substates ) {
			/** */
			return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
				var protostate;
				viaProto === undefined && ( viaProto = true );
				return (
					substates[ stateName ] ||
					viaProto && ( ( protostate = this.protostate() ) ? protostate.substate( stateName ) : undefined )
				);
			};
		},

		// TODO: rewrite to consider protostates
		substates: function ( substates ) {
			/** Returns an `Array` of this state's substates. */
			return function ( /*Boolean*/ deep ) {
				var key,
					result = [];
				for ( key in substates ) if ( hasOwn.call( substates, key ) ) {
					result.push( substates[key] );
					deep && ( result = result.concat( substates[key].substates( true ) ) );
				}
				return result;
			};
		},

		addSubstate: function ( substates ) {
			/**
			 * Creates a state from the supplied `stateDefinition` and adds it as a substate of this state.
			 * If a substate with the same `stateName` already exists, it is first destroyed and then replaced.
			 * If the new substate is being added to the controller's default state, a reference is added
			 * directly on the controller itself as well.
			 */
			return function ( /*String*/ stateName, /*StateDefinition | Object*/ stateDefinition ) {
				var	substate,
					controller = this.controller();
				( substate = substates[ stateName ] ) && substate.destroy();
				substate = this[ stateName ] = substates[ stateName ] = new State( this, stateName, stateDefinition ),
				controller.defaultState() === this && ( controller[ stateName ] = substate );
				return substate;
			};
		},

		removeSubstate: function ( substates ) {
			/** */
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
							substate === transition.target()
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

		transition: function ( transitions ) {
			/** */
			return function ( transitionName ) {
				return transitions[ transitionName ];
			};
		},

		transitions: function ( transitions ) {
			/** */
			return function () {
				return extend( true, {}, transitions );
				// var i, result = [];
				// for ( i in transitions ) if ( hasOwn.call( transitions, i ) ) {
				// 	result.push( transitions[i] );
				// }
				// return result;
			};
		},

		addTransition: function ( transitions ) {
			/** */
			return function ( /*String*/ transitionName, /*StateTransitionDefinition | Object*/ transitionDefinition ) {
				transitionDefinition instanceof State.Transition.Definition ||
					( transitionDefinition = State.Transition.Definition( transitionDefinition ) );
				return transitions[ transitionName ] = transitionDefinition;
			};
		},

		destroy: function ( setSuperstate, setDestroyed, methods, substates ) {
			/**
			 * Attempts to cleanly destroy this state and all of its substates. A 'destroy' event is issued
			 * to each state after it is destroyed.
			 */
			return function () {
				var	superstate = this.superstate(),
					controller = this.controller(),
					owner = controller.owner(),
					transition = controller.transition(),
					origin, target, methodName, method, stateName;
		
				if ( transition ) {
					origin = transition.origin();
					target = transition.target();
					if (
						this === origin || this.isSuperstateOf( origin )
							||
						this === target || this.isSuperstateOf( target )
					) {
						// TODO: instead of failing, defer destroy() until after transition.end()
						return false;
					}
				}
		
				if ( superstate ) {
					superstate.removeSubstate( name );
				} else {
					for ( methodName in methods ) if ( hasOwn.call( methods, methodName ) ) {
						// It's the default state being destroyed, so the delegates on the owner can be deleted.
						hasOwn.call( owner, methodName ) && delete owner[ methodName ];
				
						// A default state may have been holding methods for the owner, which it must give back.
						if ( ( method = methods[ methodName ] ).autochthonousToOwner ) {
							delete method.autochthonous;
							delete method.autochthonousToOwner;
							owner[ methodName ] = method;
						}
					}
				}
				for ( stateName in substates ) if ( hasOwn.call( substates, stateName ) ) {
					substates[ stateName ].destroy();
				}
				setSuperstate( undefined );
				setDestroyed( true );
				this.emit( 'destroy' );
		
				return true;
			};
		}
	});
	
	// Aliases
	extend( this, {
		on: this.addEvent,
		trigger: this.emit
	});
};
	
extend( true, State, {
	prototype: {
		/** Returns this state's fully qualified name. */
		toString: function () {
			return this.derivation( true ).join('.');
		},
		
		/** Gets the `StateController` to which this state belongs. */
		controller: function () {
			return this.superstate().controller();
		},
		
		/** Gets the owner object to which this state's controller belongs. */
		owner: function () {
			return this.controller().owner();
		},
		
		/** Gets the default state, i.e. the top-level superstate of this state. */
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
				protostate, i, l, stateName;
			
			function iterate () {
				prototype = prototype.__proto__ || prototype.constructor.prototype;
				protostate = prototype &&
						hasOwn.call( prototype, controllerName ) &&
						prototype[ controllerName ] instanceof State.Controller ?
					prototype[ controllerName ].defaultState() :
					undefined;
			}
			
			for ( iterate(); protostate; iterate() ) {
				for ( i = 0, l = derivation.length; i < l; i++ ) {
					if ( !( protostate = protostate.substate( derivation[i], false ) ) ) {
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
		
		/** Determines whether `this` is or is a substate of `state`. */
		isIn: function ( state ) {
			state instanceof State || ( state = this.match( state ) );
			return ( state === this || state.isSuperstateOf( this ) );
		},
		
		/** Determines whether `this` is a superstate of `state`. */
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
				method = mc.method;
			if ( method ) {
				return method.apply( method.autochthonous ? this.owner() : mc.context, args );
			}
		},
		
		/** @see apply */
		call: function ( methodName ) {
			return this.apply( methodName, slice.call( arguments, 1 ) );
		},
		
		/** Determines whether `this` directly possesses a method named `methodName`. */
		hasMethod: function ( methodName ) {
			var method = this.method( methodName );
			return method && method !== noop;
		},
		
		/** Determines whether `this` directly possesses a method named `methodName`. */
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
		
		/** Returns a `Boolean` indicating whether `this` is the controller's current state. */
		isSelected: function () {
			return this.controller().current() === this;
		},
		
		/** */
		pushHistory: global.history && global.history.pushState ?
			function ( title, urlBase ) {
				return global.history.pushState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
			} : noop
		,
		
		/** */
		replaceHistory: global.history && global.history.replaceState ?
			function ( title, urlBase ) {
				return global.history.replaceState( this.data, title || this.toString(), urlBase + '/' + this.derivation( true ).join('/') );
			} : noop
		,
		
		/**
		 * Returns the Boolean result of the guard function at `guardName` defined on this state, as
		 * evaluated against `testState`, or `true` if no guard exists.
		 */
		evaluateGuard: function ( /*String*/ guardName, /*State*/ testState ) {
			var	state = this,
				guard = this.guard( guardName ),
				result;
			if ( guard ) {
				each( guard, function ( selector, value ) {
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
});


function StateDefinition ( map ) {
	var D = State.Definition;
	if ( !( this instanceof D ) ) {
		return new D( map );
	}
	extend( true, this, map instanceof D ? map : D.expand( map ) );
}

State.Definition = extend( true, StateDefinition, {
	categories: [ 'data', 'methods', 'events', 'guards', 'states', 'transitions' ],
	expand: function ( map ) {
		var key, value, category,
			result = nullHash( this.categories ),
			eventTypes = invert( State.Event.types ),
			guardTypes = invert([ 'admit', 'release' ]); // invert( State.Guard.types );
		
		for ( key in map ) if ( hasOwn.call( map, key ) ) {
			value = map[key];
			
			// Priority 1 : strict type match opportunity for states and transitions
			// -- allows arbitrarily keyed values of `State({})` and `State.Transition({})`
			if ( category =
				value instanceof State.Definition && 'states'
					||
				value instanceof State.Transition.Definition && 'transitions'
			) {
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
						key in guardTypes ? 'guards' :
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
});


function StateController ( owner, name, definition, options ) {
	if ( !( this instanceof State.Controller ) ) {
		return new State.Controller( owner, name, definition, options );
	}
	
	var	defaultState, currentState, transition, getName,
		self = this,
		privileged = State.Controller.privileged,
		args = overload( arguments, this.constructor.overloads );
	
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
			toString: function () { return currentState ? currentState.toString() : undefined; }
		}),
		transition: extend( function () { return transition; }, {
			toString: function () { return transition ? transition.toString() : ''; }
		})
	});
	
	constructPrivilegedMethods( this, State.Controller.privileged, {
		'change' : [ setCurrentState, setTransition ]
	});
	
	// Instantiate the default state and initialize it as the root of the state hierarchy
	( defaultState = extend( new State(), {
		controller: function () { return self; }
	}) ).init( definition );
	
	currentState = options.initialState ? defaultState.match( options.initialState ) : defaultState;
	currentState.controller() === this || ( currentState = this.createProxy( currentState ) );
}

State.Controller = extend( true, StateController, {
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
		 * of appropriate events, and construction of temporary protostate proxies as necessary. Respects
		 * guards supplied in both the origin and target states, and fails appropriately if a matching
		 * guard disallows the change.
		 * 
		 * @param target:State
		 * @param options:Object Map of settings:
		 * 		forced:Boolean
		 * 			Overrides any guards defined, ensuring the change will complete, assuming a valid
		 * 			target.
		 * 		success:Function
		 * 			Callback to be executed upon successful completion of the change.
		 * 		failure:Function
		 * 			Callback to be executed if the change is blocked by a guard.
		 * @param setCurrentState:Function
		 * @param setTransition:Function
		 * 
		 * @see State.Controller.change
		 */
		change: function ( setCurrentState, setTransition ) {
			return function ( target, options ) {
				var	targetOwner, source, origin, domain, info, state,
					owner = this.owner(),
					transition = this.transition(),
					transitionDefinition,
					self = this;
			
				// Resolve `target` argument to a proper `State` object if necessary.
				target instanceof State || ( target = target ? this.get( target ) : this.defaultState() );
			
				if ( !target ||
						( targetOwner = target.owner() ) !== owner &&
						!targetOwner.isPrototypeOf( owner )
				) {
					throw new Error( "StateController: attempted a change to an invalid state" );
				}
			
				options || ( options = {} );
				origin = transition ? transition.origin() : this.current();
				if ( options.forced ||
						origin.evaluateGuard( 'release', target ) &&
						target.evaluateGuard( 'admit', origin )
				) {
					/*
					 * If `target` is a state from a prototype of `owner`, it must be represented here as a
					 * transient protostate proxy.
					 */
					target && target.controller() !== this && ( target = this.createProxy( target ) );
					
					// If a transition is underway, it needs to be notified that it won't finish.
					transition && transition.abort();
					
					source = state = this.current();
					domain = source.common( target );
					
					/*
					 * Retrieve the appropriate transition definition for this origin/target pairing;
					 * if none is defined then a default transition is created that will cause the callback
					 * to return immediately.
					 */
					transition = setTransition( new State.Transition(
						target,
						source,
						transitionDefinition = this.getTransitionDefinitionFor( target, origin )
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
						 * Trace a path from `target` up to `domain`, then walk down it, capturing 'enter'
						 * events along the way, and terminating with an 'arrive' event.
						 */
						for ( state = target; state !== domain; pathToState.push( state ), state = state.superstate() );
						while ( pathToState.length ) {
							transition.attachTo( state = pathToState.pop() );
							state.trigger( 'enter', info );
						}
						transition.trigger( 'exit' );
						setCurrentState( target );
						this.current().trigger( 'arrive', info );
						
						origin instanceof State.Proxy && ( this.destroyProxy( origin ), origin = null );
						transition.destroy(), transition = setTransition( null );
						
						typeof options.success === 'function' && options.success.call( this );
						return this;
					});
					
					return transition.start.apply( transition, options.arguments ) || this;
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
		destroyProxy: function ( proxy ) {
			var superstate;
			while ( proxy instanceof State.Proxy ) {
				superstate = proxy.superstate();
				proxy.destroy();
				proxy = superstate;
			}
		},
		
		/**
		 * Finds the appropriate transition definition for the given origin and target states. If no
		 * matching transitions are defined in any of the states, returns a generic transition definition
		 * for the origin/target pair with no `operation`.
		 */
		getTransitionDefinitionFor: function ( target, origin ) {
			origin || ( origin = this.current() );
			
			function search ( state, until ) {
				var result;
				for ( ; state && state !== until; state = until ? state.superstate() : undefined ) {
					each( state.transitions(), function ( i, definition ) {
						return !(
							( definition.target ? state.match( definition.target, target ) : state === target ) &&
							( !definition.origin || state.match( definition.origin, origin ) ) &&
						( result = definition ) );
					});
				}
				return result;
			}
			
			// Search order: (1) `target`, (2) `origin`, (3) superstates of `target`, (4) superstates of `origin`
			return (
				search( target ) ||
				origin !== target && search( origin ) ||
				search( target.superstate(), this.defaultState() ) || search( this.defaultState() ) ||
				!target.isIn( origin ) && search( origin.superstate(), origin.common( target ) ) ||
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
});


function StateEvent ( state, type ) {
	extend( this, {
		target: state,
		name: state.name,
		type: type
	});
}

State.Event = extend( true, StateEvent, {
	types: [ 'construct', 'destroy', 'depart', 'exit', 'enter', 'arrive', 'mutate' ],
	prototype: {
		toString: function () {
			return 'StateEvent (' + this.type + ') ' + this.name;
		},
		log: function ( text ) {
			console && console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
		}
	}
});

function StateEventCollection ( state, type ) {
	var	items = {},
		length = 0;
	function getLength () { return length; }
	getLength.valueOf = getLength;
	
	extend( this, {
		length: getLength,
		get: function ( id ) {
			return items[id];
		},
		key: function ( listener ) {
			for ( var i in items ) if ( hasOwn.call( items, i ) ) {
				if ( items[i] === listener ) {
					return i;
				}
			}
		},
		keys: function () {
			var result = [], i;
			result.toString = function () { return '[' + result.join() + ']'; };
			for ( i in items ) if ( hasOwn.call( items, i ) ) {
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
				for ( var i in items ) if ( hasOwn.call( items, i ) ) {
					delete items[i];
				}
				length = 0;
				return true;
			} else {
				return false;
			}
		},
		emit: function ( data ) {
			for ( var i in items ) if ( hasOwn.call( items, i ) ) {
				items[i].apply( state, [ extend( new State.Event( state, type ), data ) ] );
			}
		}
	});
	
	this.on = this.add;
	this.trigger = this.emit;
}

State.Event.Collection = extend( true, StateEventCollection, {
	__guid__: 0,
	prototype: {
		guid: function () {
			return ( ++this.constructor.__guid__ ).toString();
		}
	}
});


/**
 * StateProxy allows a state controller to reference a protostate from within its own state hierarchy.
 */
function StateProxy ( superstate, name ) {
	var	getName;
	extend( this, {
		superstate: function () { return superstate; },
		name: ( getName = function () { return name || ''; } ).toString = getName,
		
		// TODO: implement `invalidate`
		// If protostate gets destroyed or removed, it should invalidate this proxy 
		invalidate: function () {
			// tell controller to eject itself
		}
	});
}

State.Proxy = extend( true, StateProxy, {
	prototype: extend( true, new State( null, "[StateProxy prototype]" ), {
		guard: function ( guardName ) {
			// TODO: this.protostate() isn't resolving when it should
					// CAUSE: derived object doesn't have its StateController.name set, so it can't match with prototype's StateController
			if ( !this.protostate() ) {
				// debugger;
			}
			return this.protostate().guard( guardName );
		}
	})
});


function StateTransition ( target, source, definition, callback ) {
	if ( !( this instanceof State.Transition ) ) {
		return State.Transition.Definition.apply( this, arguments );
	}
	
	var	deferral,
		methods = {},
		events = nullHash( State.Transition.Event.types ),
		guards = {},
		operation = definition.operation,
		self = this,
		attachment = source,
	 	controller = ( controller = source.controller() ) === target.controller() ? controller : undefined,
		aborted;
	
	function setDefinition ( value ) { return definition = value; }
	
	// expose these in debug mode
	debug && extend( this.__private__ = {}, {
		methods: methods,
		events: events,
		guards: guards,
		operation: operation
	});
	
	extend( this, {
		/**
		 * `superstate` is used here to track the transition's position as it walks the State subtree domain.
		 */
		superstate: function () { return attachment; },
		
		/**
		 * 
		 */
		attachTo: function ( state ) { attachment = state; },
		
		/**
		 * 
		 */
		controller: function () { return controller; },
		
		/**
		 * 
		 */
		definition: function () { return definition; },
		
		/**
		 * 
		 */
		origin: function () { return source instanceof State.Transition ? source.origin() : source; },
		
		/**
		 * 
		 */
		source: function () { return source; },
		
		/**
		 * 
		 */
		target: function () { return target; },
		
		/**
		 * 
		 */
		setCallback: function ( fn ) { callback = fn; },
		
		/**
		 * 
		 */
		aborted: function () { return aborted; },
		
		promise: function () {
			if ( deferral ) {
				return deferral.promise();
			}
		},
		
		execute: function ( op ) {
			// [
			// 	fn1,
			// 	[[
			// 		fn2,
			// 		[[
			// 			fn3,
			// 			fn4
			// 		]],
			// 		[
			// 			fn5,
			// 			fn6
			// 		]
			// 	]],
			// 	[
			// 		fn7,
			// 		fn8
			// 	]
			// ]
			// 
			// Deferral
			// 	.then( fn1 )
			// 	.then( function () { return when(
			// 		Deferral.then( fn2 ),
			// 		Deferral.then( function () { return when(
			// 			Deferral.then( fn3 ),
			// 			Deferral.then( fn4 )
			// 		} )),
			// 		Deferral
			// 			.then( fn5 )
			// 			.then( fn6 )
			// 	} ))
			// 	.then( function () { return Deferral
			// 		.then( fn7 )
			// 		.then( fn8 )
			// 	} )
			// );
			
			function parse ( obj, promise ) {
				var arr, next, i, l;
				function parallel ( deferrals ) {
					return function () {
						var d, result = when( deferrals );
						// while ( d = deferrals.shift() ) d.fulfill( d, [self] );
						return result;
					}
				}
				if ( isFunction( obj ) ) {
					return promise ? promise.then( obj ) : new Deferral( obj );
					// return ( promise || ( new Deferral ) ).then( obj );
				} else if ( isArray( obj ) ) {
					i = 0;
					if ( obj.length === 1 && isArray( obj[0] ) ) {
						// double array, interpret as parallel/asynchronous
						for ( arr = [], obj = obj[0], l = obj.length; i < l; ) {
							arr.push( parse( obj[i++], new Deferral ) );
						}
						return promise ? promise.then( parallel( arr ) ) : parallel( arr )();
					} else {
						// single array, interpret as serial/synchronous
						for ( next = promise || ( promise = new Deferral ), l = obj.length; i < l; ) {
							next = next.then( parse( obj[i++], next ) );
						}
						return promise;
					}
				}
			}
			
			var deferral = new Deferral;
			parse( op, deferral );
			return deferral;
		},
		
		/**
		 * 
		 */
		start: function () {
			var self = this;
			aborted = false;
			this.trigger( 'start' );
			if ( isFunction( operation ) ) {
				// deferral = new Deferral();
				// add contents of `operation` to deferral
				operation.apply( this, arguments );
				// deferral.
				// return deferral.promise();
			} else if ( isArray( operation ) ) {
				// return ( this.omg( operation )
				// 	.done( function () { self.end(); } )
				// 	.fulfill( this )
				// );
				var d = this.execute( operation );
				d.done( function () { self.end(); } );
				return d.fulfill( this );
			} else {
				return this.end();
			}
		},
		
		/**
		 * 
		 */
		abort: function () {
			aborted = true;
			callback = null;
			this.trigger( 'abort' );
			return this;
		},
		
		/**
		 * 
		 */
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
		
		/**
		 * 
		 */
		destroy: function () {
			source instanceof State.Transition && source.destroy();
			target = attachment = controller = null;
		}
	});
	
	constructPrivilegedMethods( this, State.privileged, {
		'init' : [ State.Transition.Definition, setDefinition ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events on addEvent removeEvent emit trigger' : [ events ],
	});
	
	this.init();
}

State.Transition = extend( true, StateTransition, {
	prototype: extend( true, new State(), {
		depth: function () {
			for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
			return count;
		}
	}),
	
	Event: {
		types: [ 'construct', 'destroy', 'enter', 'exit', 'start', 'end', 'abort' ]
	}
});

function StateTransitionDefinition ( map ) {
	var D = State.Transition.Definition;
	if ( !( this instanceof D ) ) {
		return new D( map );
	}
	extend( true, this, map instanceof D ? map : D.expand( map ) );
}

State.Transition.Definition = extend( StateTransitionDefinition, {
	properties: [ 'origin', 'source', 'target', 'operation' ],
	categories: [ 'methods', 'events' ],
	expand: function ( map ) {
		var	properties = nullHash( this.properties ),
			categories = nullHash( this.categories ),
			result = extend( {}, properties, categories ),
			eventTypes = invert( State.Transition.Event.types ),
			key, value, category;
		for ( key in map ) if ( hasOwn.call( map, key ) ) {
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
});


// exposes everything on one place on the global object
( typeof exports !== 'undefined' ? exports :
	// typeof module !== 'undefined' ? module.exports : 
	global ).State = State;

global.Deferral = Deferral;
global.when = when;

})();
