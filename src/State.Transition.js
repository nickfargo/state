function StateTransition ( destination, source, definition, callback ) {
	if ( !( this instanceof State.Transition ) ) {
		return State.Transition.Definition.apply( this, arguments );
	}
	
	var	methods = {},
		events = nullHash( State.Transition.Event.types ),
		operation = definition.operation,
		self = this,
		attachment = source,
	 	controller = ( controller = source.controller() ) === destination.controller() ? controller : undefined,
		aborted;
	
	function setDefinition ( value ) { return definition = value; }
	
	// expose these in debug mode
	debug && extend( this.__private__ = {}, {
		methods: methods,
		events: events,
		operation: operation
	});
	
	extend( this, {
		/**
		 * Even though StateTransition inherits `superstate` from State, it requires its own implementation,
		 * which is used here to track its position as it walks the State subtree domain.
		 */
		superstate: function () { return attachment; },
		
		attachTo: function ( state ) { attachment = state; },
		controller: function () { return controller; },
		definition: function () { return definition; },
		origin: function () { return source instanceof State.Transition ? source.origin() : source; },
		source: function () { return source; },
		destination: function () { return destination; },
		setCallback: function ( fn ) { callback = fn; },
		aborted: function () { return aborted; },
		start: function () {
			aborted = false;
			this.trigger( 'start' );
			isFunction( operation ) ? operation.apply( this, arguments ) : this.end();
		},
		abort: function () {
			aborted = true;
			callback = null;
			this.trigger( 'abort' );
			return this;
		},
		end: function ( delay ) {
			if ( delay ) {
				return setTimeout( function () { self.end(); }, delay );
			}
			if ( !aborted ) {
				this.trigger( 'end' );
				callback && callback.apply( controller );
			}
			// TODO: check for deferred state destroy() calls
			this.destroy();
		},
		destroy: function () {
			source instanceof State.Transition && source.destroy();
			destination = attachment = controller = null;
		}
	});
	
	indirect( this, State.privileged, {
		'init' : [ State.Transition.Definition, setDefinition ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events addEvent removeEvent trigger' : [ events ],
	});
	
	this.init();
}

State.Transition = extend( true, StateTransition, {
	prototype: extend( true, new State(), {
		depth: function () {
			for ( var count = 0, t = this; t.source() instanceof State.Transition; count++, t = t.source() );
			return count;
		}
	}),
	
	Event: {
		types: [ 'construct', 'destroy', 'enter', 'exit', 'start', 'end', 'abort' ]
	}
});

function StateTransitionDefinition ( map ) {
	var D = State.Transition.Definition;
	if ( !( this instanceof D ) ) {
		return new D( map );
	}
	extend( true, this, map instanceof D ? map : D.expand( map ) );
}

State.Transition.Definition = extend( StateTransitionDefinition, {
	properties: [ 'origin', 'source', 'destination', 'operation' ],
	categories: [ 'methods', 'events' ],
	expand: function ( map ) {
		var	properties = nullHash( this.properties ),
			categories = nullHash( this.categories ),
			result = extend( {}, properties, categories ),
			eventTypes = invert( State.Transition.Event.types ),
			key, value, category;
		for ( key in map ) if ( hasOwn.call( map, key ) ) {
			value = map[key];
			if ( key in properties ) {
				result[key] = value;
			}
			else if ( key in categories ) {
				extend( result[key], value );
			}
			else {
				category = key in eventTypes ? 'events' : 'methods';
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
		}
		each( result.events, function ( type, value ) {
			isFunction( value ) && ( result.events[type] = value = [ value ] );
		});
		return result;
	}
});
