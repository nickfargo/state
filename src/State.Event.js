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
		length = 0,
		getLength = ( getLength = function () { return length; } ).toString = getLength;
		
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
		trigger: function ( data ) {
			for ( var i in items ) if ( hasOwn.call( items, i ) ) {
				items[i].apply( state, [ extend( new State.Event( state, type ), data ) ] );
			}
		}
	});
}

State.Event.Collection = extend( true, StateEventCollection, {
	__guid__: 0,
	prototype: {
		guid: function () {
			return ( ++this.constructor.__guid__ ).toString();
		}
	}
});
