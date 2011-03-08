State.Event = $.extend( true,
	function StateEvent( state, type ) {
		$.extend( this, {
			target: state,
			name: state.name,
			type: type
		});
	}, {
		prototype: {
			toString: function() {
				return 'StateEvent';
			},
			log: function(text) {
				console.log( this + ' ' + this.name + '.' + this.type + ( text ? ' ' + text : '' ) );
			}
		},
		Collection: $.extend( true,
			function StateEventCollection( state, type ) {
				var	items = {},
					length = 0,
					getLength = ( getLength = function() { return length; } ).toString = getLength;
					
				$.extend( this, {
					length: getLength,
					get: function(id) {
						return items[id];
					},
					key: function( listener ) {
						var result;
						$.each( items, function( id, fn ) {
							result = ( fn === listener ? id : undefined );
							return result === undefined;
						});
						return result;
					},
					keys: function() {
						var result = [];
						result.toString = function() { return '[' + result.join() + ']'; };
						$.each( items, function(key) {
							result.push(key);
						});
						return result;
					},
					add: function(fn) {
						var id = this.guid();
						items[id] = fn;
						length++;
						return id;
					},
					remove: function(id) {
						var fn = items[id];
						if ( fn ) {
							delete items[id];
							length--;
							return fn;
						}
						return false;
					},
					empty: function() {
						if ( length ) {
							for ( var i in items ) {
								delete items[i];
							}
							length = 0;
							return true;
						} else {
							return false;
						}
					},
					trigger: function() {
						$.each( items, function( id, fn ) {
							fn.apply( state, [ new State.Event( state, type ) ] );
						});
					}
				});
			}, {
				__guid__: 0,
				prototype: {
					guid: function() {
						return ( ++this.constructor.__guid__ ).toString();
					}
				}
			}
		)
	}
);
