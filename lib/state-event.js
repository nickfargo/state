// <a id="state-event" />

// ## StateEvent
// 
// When an event is emitted from a state, it passes a `StateEvent` object to any bound listeners,
// containing the `type` string and a reference to the contextual `state`.

var StateEvent = ( function () {

    // ### Constructor
    function StateEvent ( state, type ) {
        Z.assign( this, {
            target: state,
            name: state.toString(),
            type: type
        });
    }

    StateEvent.prototype.toString = function () {
        return 'StateEvent (' + this.type + ') ' + this.name;
    };
    
    return StateEvent;
})();

// <a id="state-event-collection" />

// ## StateEventCollection
// 
// A state holds event listeners for each of its various event types in a `StateEventCollection`
// instance.

var StateEventCollection = ( function () {
    var guid = 0;

    // ### Constructor
    function StateEventCollection ( state, type ) {
        this.state = state;
        this.type = type;
        this.items = {};
        this.length = 0;
    }

    Z.assign( StateEventCollection.prototype, {
        // #### guid
        // 
        // Produces a unique numeric string, to be used as a key for bound event listeners.
        guid: function () {
            return ( ++guid ).toString();
        },

        // #### get
        // 
        // Retrieves a bound listener associated with the provided `id` string as returned by
        // the prior call to `add`.
        get: function ( id ) {
            return this.items[id];
        },

        // #### key
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( listener ) {
            var i, items = this.items;
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                if ( items[i] === listener ) return i;
            }
        },

        // #### keys
        // 
        // Returns the set of `id` strings associated with all bound listeners.
        keys: function () {
            var i, items = this.items, result = [];

            result.toString = function () { return '[' + result.join() + ']'; };
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // #### add
        // 
        // Binds a listener, along with an optional context object, to be called when the
        // the collection `emit`s an event. Returns a unique key that can be used later to
        // `remove` the listener.
        // 
        // *Aliases:* **on bind**
        add: function (
            /*Function*/ fn,
              /*Object*/ context  // optional
        ) {
            var id = this.guid();
            this.items[id] = typeof context === 'object' ? [ fn, context ] : fn;
            this.length++;
            return id;
        },

        // #### remove
        // 
        // Unbinds a listener. Accepts either the numeric string returned by `add` or a reference
        // to the function itself.
        // 
        // *Aliases:* **off unbind**
        remove: function ( /*Function | String*/ id ) {
            var fn, i, l,
                items = this.items;
            
            fn = items[ typeof id === 'function' ? this.key( id ) : id ];
            if ( !fn ) return false;
            delete items[id];
            this.length--;
            return fn;
        },

        // #### empty
        empty: function () {
            var i, items = this.items;

            if ( !this.length ) return false;

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return true;
        },

        // #### emit
        // 
        // Creates a `StateEvent` and begins propagation of it through all bound listeners.
        // 
        // *Alias:* **trigger**
        emit: function ( args, state ) {
            var i, item, fn, context, result, target,
                items = this.items, type = this.type;
            
            state || ( state = this.state );

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                item = items[i];
                
                if ( typeof item === 'function' ) {
                    fn = item, context = state;
                } else if ( Z.isArray( item ) ) {
                    fn = item[0], context = item[1];
                }

                args.unshift( new StateEvent( state, type ) );
                fn && ( result = fn.apply( context, args ) );
            }

            // If `result` is a String or State, interpret this as an implied transition to be
            // applied on this event’s state.
            if ( typeof result === 'string' || result instanceof State ) {
                target = state.match( result );
                target && state.change( target );
            }
        },

        // #### destroy
        destroy: function () {
            this.empty();
            delete this.state, delete this.type, delete this.items, delete this.length;
            return true;
        }
    });
    Z.alias( StateEventCollection.prototype, {
        add: 'on bind',
        remove: 'off unbind',
        emit: 'trigger'
    });

    return StateEventCollection;
})();
