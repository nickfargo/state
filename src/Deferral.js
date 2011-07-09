/**
 * 
 */
function Deferral ( fn ) {
	var	callbacks, resolve, bind;
	
	( this.reset = function () {
		callbacks = { done: [], fail: [] };
		return this;
	})();
	
	bind = Deferral.privileged.bind( callbacks );
	resolve = Deferral.privileged.resolve( callbacks );
	
	extend( this, {
		done: bind( 'done' ),
		fail: bind( 'fail' ),
		succeed: resolve( 'done' ),
		forfeit: resolve( 'fail' )
	});
	
	bind = resolve = null;
	
	fn && isFunction( fn ) && fn.apply( this, slice( arguments, 1 ) );
}
extend( true, Deferral, {
	anti: { done: 'fail', fail: 'done' },
	privileged: {
		/** Produces a function that pushes callbacks onto one of the callback queues. */
		bind: function ( callbacks ) {
			return function ( as ) { // as = { 'done' | 'fail' }
				return function ( fn ) {
					// TODO decide between ...
					
					// either:
					isFunction( fn ) && callbacks[as].push( fn ) || isArray( fn ) && forEach( fn, this[as] );
					return this;
					
					// or:
					var i, l;
					if ( isFunction( fn ) ) {
						callbacks[as].push( fn );
					} else if ( isArray( fn ) ) {
						for ( i = 0, l = fn.length; i < l; i++ ) {
							this[as]( fn[i] );
						}
					}
					return this;
				};
			};
		},
		
		/** Produces a function that resolves the deferral as either fulfilled or failed. */
		resolve: function ( callbacks ) {
			return function ( as ) { // as = { 'done' | 'fail' }
				var not = Deferral.anti[as];
				return function ( context, args ) {
					this[as] = this.invoke( callbacks ), this[not] = this.resolve = noop;
					callbacks.context = context, callbacks.args = args;
					this.invokeAll( callbacks )( callbacks[as] );
					delete callbacks[as], delete callbacks[not];
					return this;
				};
			};
		}
	},
	prototype: {
		/** Determines whether the deferral has either been fulfilled or failed. */
		isResolved: function () { return this.done === noop || this.fail === noop },
		
		/** Determines whether the deferral has been fulfilled. */
		isFulfilled: function () {
			return this.fail === noop ? true : this.done === noop ? false : undefined;
		},
		
		/** Returns a function that will become the deferral's `done` or `fail` method once it has been resolved. */
		invoke: function ( callbacks ) {
			var self = this;
			return function ( fn ) {
				try {
					isFunction( fn ) && fn.apply( callbacks.context || self, callbacks.args )
						||
					isArray( fn ) && self.invokeAll( callbacks )( fn );
				} catch ( nothing ) {}
				return !!fn;
			};
		},
		
		/** Analogue of `invoke`, for an array of callbacks. */
		invokeAll: function ( callbacks ) {
			var self = this;
			return function ( fns ) {
				while ( self.invoke( callbacks )( fns.shift() ) );
			};
		},
		
		/** Unified interface for adding `done` and `fail` callbacks. */
		then: function ( done, fail ) {
			return this.done( done ).fail( fail );
		},
		
		/**
		 * Interface for adding callbacks that will execute once the deferral is resolved, regardless of
		 * whether it is fulfilled or not.
		 */
		always: function () {
			var fns = slice( arguments );
			return this.done( fns ).fail( fns );
		},
		
		/** Returns a `Promise` bound to this deferral. */
		promise: function () {
			return new Promise( this );
		}
	}
});

/**
 * `Promise` is a limited interface into a `Deferral` instance. Consumers of the promise may add
 * callbacks to the represented deferral, and may check its resolved/fulfilled states, but cannot affect
 * the deferral itself as would be done with the deferral's `succeed` and `forfeit` methods.
 */
function Promise ( deferral ) {
	var promise = this,
		i = Promise.methods.length;
	while ( i-- ) {
		( function ( name ) {
			promise[name] = function () {
				deferral[name].apply( deferral, arguments );
				return promise;
			};
		})( Promise.methods[i] );
	}
}
Promise.methods = 'isResolved isFulfilled done fail then always'.split(' ');

function Operation ( fn, context ) {
	var d = new Deferral();
	fn.apply( context, slice( arguments, 2 ) );
}

/**
 * Binds together the fate of all the deferrals submitted as arguments, returning a promise that will be
 * fulfilled only after all the individual deferrals are fulfilled, or will fail immediately after any one
 * deferral fails.
 */
function when ( arg /*...*/ ) {
	var	args = flatten( slice( arguments ) ),
		length = args.length || 1,
		unresolvedCount = length,
		i = 0,
		deferral = length === 1 ?
			arg instanceof Deferral ?
				arg
				:
				( deferral = new Deferral() ).succeed( deferral, arg )
			:
			new Deferral();
	
	function succeed () {
		--unresolvedCount || deferral.succeed( deferral, arguments );
	}
	
	if ( length > 1 ) {
		for ( ; i < length; i++ ) {
			arg = args[i];
			arg instanceof Deferral || arg instanceof Promise ||
				( arg = args[i] = ( new Deferral() ).succeed( deferral, arg ) );
			arg.then( succeed, deferral.forfeit );
		}
	}
	
	return deferral.promise();
}

window.Deferral = Deferral;
window.Promise = Promise;
window.when = when;
