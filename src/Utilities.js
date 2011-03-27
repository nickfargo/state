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
