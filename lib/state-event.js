function StateEvent ( state, type ) {
	Z.extend( this, {
		target: state,
		name: state.name,
		type: type
	});
}

Z.extend( true, StateEvent, {
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

var StateEventCollection = ( function () {
	var guid = 0;

	function StateEventCollection ( state, type ) {
		this.state = state;
		this.type = type;
		this.items = {};
		this.length = 0;
	}

	Z.extend( StateEventCollection.prototype, {
		guid: function () {
			return ( ++guid ).toString();
		},
		get: function ( id ) {
			return this.items[id];
		},
		key: function ( listener ) {
			var i, items = this.items;
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				if ( items[i] === listener ) return i;
			}
		},
		keys: function () {
			var i, items = this.items, result = [];
			result.toString = function () { return '[' + result.join() + ']'; };
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				result.push( items[i] );
			}
			return result;
		},
		add: function ( fn ) {
			var id = this.guid();
			this.items[id] = fn;
			this.length++;
			return id;
		},
		remove: function ( id ) {
			var items = this.items, fn = items[id];
			if ( fn ) {
				delete items[id];
				this.length--;
				return fn;
			}
			return false;
		},
		empty: function () {
			var i, items = this.items;
			if ( this.length ) {
				for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
					delete items[i];
				}
				this.length = 0;
				return true;
			} else {
				return false;
			}
		},
		emit: function ( data ) {
			var i, items = this.items, state = this.state, type = this.type;
			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				items[i].apply( state, [ Z.extend( new StateEvent( state, type ), data ) ] );
			}
		}
	});
	Z.alias( StateEventCollection.prototype, {
		add: 'on',
		emit: 'trigger'
	});

	return StateEventCollection;
})();
