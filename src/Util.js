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