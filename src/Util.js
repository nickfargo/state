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
