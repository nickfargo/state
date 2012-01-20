/**
 * # Utility functions
 */

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
		types.push( Z.type( args[i] ) );
	}
	if ( types.length && ( types = types.join(' ') ) in map ) {
		names = map[ types ].split(' ');
		for ( i = 0, l = names.length; i < l; i++ ) {
			result[ names[i] ] = args[i];
		}
	}
	return result;
}
