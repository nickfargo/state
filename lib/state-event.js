var StateEvent = ( function () {
	function StateEvent ( state, type ) {
		Z.extend( this, {
			target: state,
			name: state.toString(),
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
	
	return StateEvent;
})();

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

		add: function ( fn, context ) {
			var id = this.guid();
			this.items[id] = typeof context === 'object' ? [ fn, context ] : fn;
			this.length++;
			return id;
		},

		remove: function ( id ) {
			var	fn, i, l,
				items = this.items;
			
			if ( typeof id === 'function' ) {
				for ( i = 0, l = items.length; i < l; i++ ) {
					if ( id === items[i] && ( fn = id ) ) {
						break;
					}
				}
			} else {
				fn = items[id];
			}
			if ( !fn ) {
				return false;
			}

			delete items[id];
			this.length--;
			return fn;
		},

		empty: function () {
			var i, items = this.items;

			if ( !this.length ) return false;

			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
			this.length = 0;
			return true;
		},

		emit: function ( args, state ) {
			var	i, item, fn, context,
				items = this.items, type = this.type;
			
			state || ( state = this.state );

			for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
				item = items[i];
				
				if ( typeof item === 'function' ) {
					fn = item, context = state;
				} else if ( Z.isArray( item ) ) {
					fn = item[0], context = item[1];
				}

				args.unshift( new StateEvent( state, type ) );
				fn && fn.apply( context, args );
			}
		},

		destroy: function () {
			this.empty();
			delete this.state, delete this.type, delete this.items, delete this.length;
			return true;
		}
	});
	Z.alias( StateEventCollection.prototype, {
		add: 'on bind',
		remove: 'off unbind',
		emit: 'trigger'
	});

	return StateEventCollection;
})();
