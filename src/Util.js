/**
 * # Utility functions
 */

var	toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty,
	trim = String.prototype.trim ?
		function ( text ) { return text == null ? '' : String.prototype.trim.call( text ); }:
		function ( text ) { return text == null ? '' : text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' ); };

/**
 * Calls the specified native function if it exists and returns its result; if no such function exists on
 * `obj` as registered in `__native.fn`, returns our unique `noop` (as opposed to `null` or `undefined`,
 * which may be a valid result from the native function itself).
 */
function __native ( item, obj /* , ... */ ) {
	var n = __native.fn[item];
	return n && obj[item] === n ? n.apply( obj, slice( arguments, 2 ) ) : noop;
}
__native.fn = {
	forEach: Array.prototype.forEach
};

/**
 * General-purpose empty function; also usable as a unique alternative "nil" type in strict-equal matches
 * whenever it's desirable to avoid traditional `null` and `undefined`.
 */
function noop () {}

function type ( obj ) { return obj == null ? String( obj ) : type.map[ toString.call( obj ) ] || 'object'; }
type.map = {};
each( 'Boolean Number String Function Array Date RegExp Object'.split(' '), function( i, name ) {
	type.map[ "[object " + name + "]" ] = name.toLowerCase();
});

function isNumber ( n ) { return !isNaN( parseFloat( n ) && isFinite( n ) ); }
function isArray ( obj ) { return type( obj ) === 'array'; }
function isFunction ( obj ) { return type( obj ) === 'function'; }
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
function isEmpty( obj, andPrototype ) {
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

function concat () { return Array.prototype.concat.apply( [], arguments ); }

function slice ( array, begin, end ) { return Array.prototype.slice.call( array, begin, end ); }

function flatten ( array ) {
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

function keys ( obj ) {
	var key, result = [];
	for ( key in obj ) if ( hasOwn.call( obj, key ) ) {
		result.push( i );
	}
	return result;
}

function invert ( array ) {
	var	i = 0,
		l = array.length,
		map = {};
	for ( ; i < l; i++ ) {
		map[ array[i] ] = i;
	}
	return map;
}

function nullify ( obj ) {
	for ( var i in obj ) if ( hasOwn.call( obj, i ) ) {
		obj[i] = null;
	}
	return obj;
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

function overload ( args, map ) {
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

function excise ( deep, target ) { //// untested
	var	args = slice( arguments ),
		i, key, obj,
		delta = {};
	deep === !!deep && args.shift();
	target = args[0];
	for ( i = args.length; --i; ) {
		obj = args[i];
		for ( key in obj ) {
			if ( deep && isPlainObject( obj[key] ) ) {
				delta[key] = excise( target[key], obj[key] );
			} else if ( !!obj[key] ) {
				delta[key] = target[key];
				delete target[key];
			}
			// deep && isPlainObject( obj[key] ) && ( delta[key] = excise( target[key], obj[key] ) ) ||
			// !!obj[key] && ( delta[key] = target[key], delete target[key] );
		}
	}
	return delta;
}