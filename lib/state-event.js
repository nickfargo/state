// ## StateEvent <a name="state-event" href="#state-event">&#x1f517;</a>
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

// ## StateEventCollection <a name="state-event-collection" href="#state-event-collection">&#x1f517;</a>
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

    // ### Prototype methods
    Z.assign( StateEventCollection.prototype, {

        // #### guid
        // 
        // Produces a unique numeric string, to be used as a key for bound event listeners.
        guid: function () {
            return ( guid += 1 ).toString();
        },

        // #### get
        // 
        // Retrieves a bound listener associated with the provided `id` string as returned by
        // the prior call to `add`.
        get: function ( /*String*/ id ) {
            return this.items[id];
        },

        // #### key
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( /*Function*/ listener ) {
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
        'add on bind': function (
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
        'remove off unbind': function ( /*Function | String*/ id ) {
            var fn, i, l,
                items = this.items;
            
            fn = items[ typeof id === 'function' ? this.key( id ) : id ];
            if ( !fn ) return false;
            delete items[id];
            this.length--;
            return fn;
        },

        // #### empty
        // 
        empty: function () {
            var i, items = this.items;

            if ( !this.length ) return false;

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return true;
        },

        // #### emit
        // 
        // Emits a `StateEvent` to all bound listeners.
        // 
        // *Alias:* **trigger**
        'emit trigger': function ( args, state ) {
            var i, item, itemType, fn, context, target,
                items = this.items, type = this.type;
            
            state || ( state = this.state );

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                item = items[i], itemType = Z.type( item );

                if ( itemType === 'function' ) {
                    fn = item, context = state;
                }
                else if ( itemType === 'array' ) {
                    fn = item[0], context = item[1];
                }

                // If `item` is a String or State, interpret this as an implied transition to be
                // instigated from the client `State` after all the callbacks have been invoked.
                else if ( itemType === 'string' || item instanceof State ) {
                    target = item;
                    continue;
                }

                fn.apply( context, [ new StateEvent( state, type ) ].concat( args ) );
                fn = context = null;
            }

            target && state.change( target );
        },

        // #### destroy
        // 
        destroy: function () {
            this.empty();
            delete this.state, delete this.items;
            return true;
        }
    });

    return StateEventCollection;
})();
