State.Transition = $.extend( true,
	function StateTransition ( source, destination, action ) {
		var	superstate = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			callback,
			aborted;
		
		$.extend( this, {
			superstate: function () { return superstate; },
			attachTo: function ( state ) {
				superstate = state;
			},
			controller: function () { return controller; },
			origin: function () {
				return source instanceof State.Transition ? source.origin() : source;
			},
			source: function () { return source; },
			destination: function () { return destination; },
			start: function ( fn ) {
				callback = fn;
				typeof action === 'function' ? action.apply( this, Util.slice( arguments, -1 ) ) : this.finish();
			},
			abort: function () {
				aborted = true;
				return this;
			},
			finish: function () {
				aborted || callback.apply( controller );
				// TODO: check for deferred state destroy() calls
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = superstate = controller = null;
			}
		});
	}, {
		prototype: $.extend( true, new State(), {
			depth: function () {
				for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
				return count;
			}
		}),
		
		Definition: $.extend( true,
			function StateTransitionDefinition ( map ) {
				
			}, {
				
			}
		)
	}
);
