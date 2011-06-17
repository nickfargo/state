State.Transition = extend( true,
	function StateTransition ( destination, source, definition, callback ) {
		if ( !( this instanceof State.Transition ) ) {
			return State.Transition.Definition.apply( this, arguments );
		}
		definition instanceof State.Transition.Definition || ( definition = new State.Transition.Definition( definition ) );
		
		var	operation = definition.operation,
			self = this,
			attachment = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			aborted;
		
		extend( this, {
			/**
			 * Even though StateTransition inherits `superstate` from State, it requires its own implementation,
			 * which is used here to track its position as it walks the State subtree domain.
			 */
			superstate: function () { return attachment; },
			
			attachTo: function ( state ) { attachment = state; },
			controller: function () { return controller; },
			origin: function () { return source instanceof State.Transition ? source.origin() : source; },
			source: function () { return source; },
			destination: function () { return destination; },
			setCallback: function ( fn ) { callback = fn; },
			aborted: function () { return aborted; },
			start: function () {
				aborted = false;
				isFunction( operation ) ? operation.apply( this, arguments ) : this.end();
			},
			abort: function () {
				aborted = true;
				callback = null;
				return this;
			},
			end: function ( delay ) {
				if ( delay ) {
					return setTimeout( function () { self.end(); }, delay );
				}
				aborted || callback && callback.apply( controller );
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = attachment = controller = null;
			}
		});
	}, {
		prototype: extend( true, new State(), {
			depth: function () {
				for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
				return count;
			}
		}),
		
		Definition: extend( true,
			function StateTransitionDefinition ( map ) {
				var D = State.Transition.Definition;
				if ( !( this instanceof D ) ) {
					return new D( map );
				}
				extend( true, this, map instanceof D ? map : D.expand( map ) );
			}, {
				members: [ 'origin', 'source', 'destination', 'operation' ],
				expand: function ( map ) {
					var result = nullHash( this.members );
					extend( result, map );
					return result;
				}
			}
		)
	}
);
