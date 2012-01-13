function StateTransition ( target, source, definition, callback ) {
	if ( !( this instanceof State.Transition ) ) {
		return State.Transition.Definition.apply( this, arguments );
	}
	
	var	deferral,
		methods = {},
		events = nullHash( State.Transition.Event.types ),
		guards = {},
		operation = definition.operation,
		self = this,
		attachment = source,
	 	controller = ( controller = source.controller() ) === target.controller() ? controller : undefined,
		aborted;
	
	function setDefinition ( value ) { return definition = value; }
	
	// expose these in debug mode
	Z.env.debug && extend( this.__private__ = {}, {
		methods: methods,
		events: events,
		guards: guards,
		operation: operation
	});
	
	extend( this, {
		/**
		 * `superstate` is used here to track the transition's position as it walks the State subtree domain.
		 */
		superstate: function () { return attachment; },
		
		/**
		 * 
		 */
		attachTo: function ( state ) { attachment = state; },
		
		/**
		 * 
		 */
		controller: function () { return controller; },
		
		/**
		 * 
		 */
		definition: function () { return definition; },
		
		/**
		 * 
		 */
		origin: function () { return source instanceof State.Transition ? source.origin() : source; },
		
		/**
		 * 
		 */
		source: function () { return source; },
		
		/**
		 * 
		 */
		target: function () { return target; },
		
		/**
		 * 
		 */
		setCallback: function ( fn ) { callback = fn; },
		
		/**
		 * 
		 */
		aborted: function () { return aborted; },
		
		promise: function () {
			if ( deferral ) {
				return deferral.promise();
			}
		},
		
		execute: function ( op ) {
			// [
			// 	fn1,
			// 	[[
			// 		fn2,
			// 		[[
			// 			fn3,
			// 			fn4
			// 		]],
			// 		[
			// 			fn5,
			// 			fn6
			// 		]
			// 	]],
			// 	[
			// 		fn7,
			// 		fn8
			// 	]
			// ]
			// 
			// Deferral
			// 	.then( fn1 )
			// 	.then( function () { return when(
			// 		Deferral.then( fn2 ),
			// 		Deferral.then( function () { return when(
			// 			Deferral.then( fn3 ),
			// 			Deferral.then( fn4 )
			// 		} )),
			// 		Deferral
			// 			.then( fn5 )
			// 			.then( fn6 )
			// 	} ))
			// 	.then( function () { return Deferral
			// 		.then( fn7 )
			// 		.then( fn8 )
			// 	} )
			// );
			
			function parse ( obj, promise ) {
				var arr, next, i, l;
				function parallel ( deferrals ) {
					return function () {
						var d, result = when( deferrals );
						// while ( d = deferrals.shift() ) d.fulfill( d, [self] );
						return result;
					}
				}
				if ( isFunction( obj ) ) {
					return promise ? promise.then( obj ) : new Deferral( obj );
					// return ( promise || ( new Deferral ) ).then( obj );
				} else if ( isArray( obj ) ) {
					i = 0;
					if ( obj.length === 1 && isArray( obj[0] ) ) {
						// double array, interpret as parallel/asynchronous
						for ( arr = [], obj = obj[0], l = obj.length; i < l; ) {
							arr.push( parse( obj[i++], new Deferral ) );
						}
						return promise ? promise.then( parallel( arr ) ) : parallel( arr )();
					} else {
						// single array, interpret as serial/synchronous
						for ( next = promise || ( promise = new Deferral ), l = obj.length; i < l; ) {
							next = next.then( parse( obj[i++], next ) );
						}
						return promise;
					}
				}
			}
			
			var deferral = new Deferral;
			parse( op, deferral );
			return deferral;
		},
		
		/**
		 * 
		 */
		start: function () {
			var self = this;
			aborted = false;
			this.trigger( 'start' );
			if ( isFunction( operation ) ) {
				// deferral = new Deferral();
				// add contents of `operation` to deferral
				operation.apply( this, arguments );
				// deferral.
				// return deferral.promise();
			} else if ( isArray( operation ) ) {
				// return ( this.omg( operation )
				// 	.done( function () { self.end(); } )
				// 	.fulfill( this )
				// );
				var d = this.execute( operation );
				d.done( function () { self.end(); } );
				return d.fulfill( this );
			} else {
				return this.end();
			}
		},
		
		/**
		 * 
		 */
		abort: function () {
			aborted = true;
			callback = null;
			this.trigger( 'abort' );
			return this;
		},
		
		/**
		 * 
		 */
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
		
		/**
		 * 
		 */
		destroy: function () {
			source instanceof State.Transition && source.destroy();
			target = attachment = controller = null;
		}
	});
	
	constructPrivilegedMethods( this, State.privileged, {
		'init' : [ State.Transition.Definition, setDefinition ],
		'method methodAndContext methodNames addMethod removeMethod' : [ methods ],
		'event events on addEvent removeEvent emit trigger' : [ events ],
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
	properties: [ 'origin', 'source', 'target', 'operation' ],
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
