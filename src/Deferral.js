/**
 * 
 */
function Deferral ( fn ) {
	var	callbacks, bind, resolve;
	
	( this.empty = function () {
		callbacks = { done: [], fail: [] };
		return this;
	})();
	
	this.__private__ = {
		callbacks: callbacks
	};
	
	bind = Deferral.privileged.bind( callbacks );
	resolve = Deferral.privileged.resolve( callbacks );
	extend( this, {
		done: bind( 'done' ),
		fail: bind( 'fail' ),
		fulfill: resolve( 'done' ),
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
					isFunction( fn ) && callbacks[as].push( fn ) || isArray( fn ) && forEach( fn, this[as] );
					return this;
				};
			};
		},
		
		/** Produces a function that resolves the deferral as either fulfilled or forfeited. */
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
		/** Determines whether the deferral has been fulfilled. */
		isFulfilled: function () {
			return this.fail === noop ? true : this.done === noop ? false : undefined;
		},
		
		/** Determines whether the deferral has been forfeited. */
		isForfeited: function () {
			return this.done === noop ? true : this.fail === noop ? false : undefined;
		},
		
		/** Determines whether the deferral has been either fulfilled or forfeited. */
		isResolved: function () {
			return this.done === noop || this.fail === noop;
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
	},
	then: function () {
		return ( new Deferral() ).then( arguments );
	}
});


/**
 * `Promise` is a limited interface into a `Deferral` instance. Consumers of the promise may add
 * callbacks to the represented deferral, and may check its resolved/fulfilled states, but cannot affect
 * the deferral itself as would be done with the deferral's `fulfill` and `forfeit` methods.
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
extend( Promise, {
	methods: 'isResolved isFulfilled done fail then always'.split(' '),
	
	/** Weakly duck-types an object against `Promise`, checking for `then()` */
	resembles: function ( obj ) {
		return obj && isFunction( obj.then );
	}
});


function Operation ( fn ) {
	var	deferral = new Deferral(),
		next;
	
	extend( this, {
		/** Executes `fn`, then `apply`s all successive operations */
		apply: function ( context, args ) {
			next && deferral.then( function () { next.apply( context, args ); } );
			deferral.fulfill( context, args );
		},
		
		/** Adds `op` to end of `next` chain */
		then: function ( op ) {
			return next.then( op ) || ( next = op );
		},
		
		promise: function () {
			return deferral.promise();
		}
	});
	
	deferral.then( fn );
}
Operation.prototype.call = function ( context ) {
	return this.apply( context, slice( arguments, 1 ) );
};


/**
 * Binds together the fate of all the deferrals submitted as arguments, returning a promise that will be
 * fulfilled only after all the individual deferrals are fulfilled, or will be forfeited immediately after
 * any one deferral is forfeited.
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
				( deferral = new Deferral() ).fulfill( deferral, arg )
			:
			new Deferral();
	
	function fulfill () {
		--unresolvedCount || deferral.fulfill( deferral, arguments );
	}
	
	if ( length > 1 ) {
		for ( ; i < length; i++ ) {
			arg = args[i];
			arg instanceof Deferral || arg instanceof Promise ||
				( arg = args[i] = ( new Deferral() ).fulfill( deferral, arg ) );
			arg.then( fulfill, deferral.forfeit );
		}
	}
	
	return deferral.promise();
}

window.Deferral = Deferral;
window.Promise = Promise;
window.when = when;
