/**
 * Module-level utility functions
 */

// TODO: check for presence of jQuery, Underscore, etc., or fall back to script-loaded independent implementations 
var	each = $.each,
	extend = $.extend,
	trim = $.trim,
	isArray = $.isArray,
	isFunction = $.isFunction,
	isPlainObject = $.isPlainObject;

function concat () { return Array.prototype.concat.apply( [], arguments ); }

function slice ( array, begin, end ) { return Array.prototype.slice.call( array, begin, end ); }

function invert ( array ) {
	var	map = {};
	for ( var i in array ) {
		map[ array[i] ] = i;
	}
	return map;
}

function nullify ( o ) {
	for ( var i in o ) {
		o[i] = null;
	}
	return o;
}

function nullHash( keys ) { return nullify( invert( keys ) ); }

function resolveOverloads ( args, map ) {
	var	i,
		types = [],
		names,
		result = {};
	args = slice( args );
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