State.Controller.History = extend( true,
	function StateControllerHistory () {
		var stack = [];
		
		extend( this, {
			push: function ( operation ) {
				if ( operation instanceof State.Controller.Operation ) {
					if ( stack.length == this.limit ) {
						stack.shift();
					}
					return stack.push( operation );
				}
			},
			pop: function () {
				return stack.pop();
			},
			last: function () {
				return this.index( -1 );
			},
			index: function ( index ) {
				var l = stack.length;
				if ( l ) {
					if ( ( index = parseInt( index ) ) < 0 ) {
						index += l;
					}
					if ( index < l ) {
						return stack[ index ];
					}
				}
			}
		});
	}, {
		prototype: {
			limit: 50
		}
	}
);