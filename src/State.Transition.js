State.Transition = $.extend( true,
	function StateTransition ( source, destination, action ) {
		var	transition = this,
			attachment = source,
		 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
			callback,
			aborted;
		
		$.extend( this, {
			superstate: function () { return attachment; },
			attachTo: function ( state ) {
				attachment = state;
			},
			controller: function () { return controller; },
			origin: function () {
				return source instanceof State.Transition ? source.origin() : source;
			},
			source: function () { return source; },
			destination: function () { return destination; },
			aborted: function () { return aborted; },
			start: function ( fn ) {
				aborted = false;
				callback = fn;
				typeof action === 'function' ? action.apply( this, Util.slice( arguments, 0, -1 ) ) : this.finish();
			},
			abort: function () {
				aborted = true;
				callback = null;
				return this;
			},
			finish: function () {
				aborted || callback.apply( controller );
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			destroy: function () {
				source instanceof State.Transition && source.destroy();
				destination = attachment = controller = null;
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
