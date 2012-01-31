var Transition = ( function () {
	Z.inherit( Transition, State );

	function Transition ( target, source, definition, callback ) {
		if ( !( this instanceof Transition ) ) {
			return TransitionDefinition.apply( this, arguments );
		}
		
		var	self = this,
			methods = {},
			events = {},
			guards = {},
			action = definition.action,
			attachment = source,
		 	controller, aborted;
		
		controller = source.controller();
		if ( controller !== target.controller() ) {
			controller = undefined;
		}

		// expose these in debug mode
		Z.env.debug && Z.assign( this.__private__ = {}, {
			methods: methods,
			events: events,
			guards: guards,
			action: action
		});

		Z.assign( this, {
			/**
			 * `superstate` is used here to track the transition's position as it walks the State
			 * subtree domain.
			 */
			superstate: function () { return attachment; },
			attachTo: function ( state ) { return attachment = state; },
			controller: function () { return controller; },
			origin: function () {
				return source instanceof Transition ? source.origin() : source;
			},
			source: function () { return source; },
			target: function () { return target; },
			setCallback: function ( fn ) { return callback = fn; },
			aborted: function () { return aborted; },
			
			/** */
			start: function () {
				var self = this;
				aborted = false;
				this.emit( 'start' );
				if ( Z.isFunction( action ) ) {
					action.apply( this, arguments );
				} else {
					return this.end();
				}
			},
			
			/** */
			abort: function () {
				aborted = true;
				callback = null;
				this.emit( 'abort' );
				return this;
			},
			
			/** */
			end: function ( delay ) {
				if ( delay ) {
					return setTimeout( function () { self.end(); }, delay );
				}
				if ( !aborted ) {
					this.emit( 'end' );
					callback && callback.apply( controller );
				}
				// TODO: check for deferred state destroy() calls
				this.destroy();
			},
			
			/** */
			destroy: function () {
				source instanceof Transition && source.destroy();
				target = attachment = controller = null;
			}
		});
		Z.privilege( this, State.privileged, {
			'init' : [ TransitionDefinition ],
			'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
			'event addEvent removeEvent emit' : [ events ],
		});
		Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );
		
		this.init( definition );
		definition = null;
	}

	Transition.prototype.depth = function () {
		var count = 0, transition = this, source;
		while ( ( source = transition.source() ) instanceof Transition ) {
			transition = source;
			count++;
		}
		return count;
	};
	
	return Transition;
})();