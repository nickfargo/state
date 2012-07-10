// <a class="icon-link"
//    name="state-event-emitter"
//    href="#state-event-emitter"></a>
// 
// ## StateEventEmitter
// 
// A state holds event listeners for a given event type in a `StateEventEmitter`
// instance.
// 
// An event listener is usually a function, but may also be held as a string,
// which, when the client state [`emit`](#state--privileged--emit)s
// the event type associated with this emitter, will be interpreted as an
// implicit order for the emitting state to [`change`](#state--prototype--change)
// to the target state named by the string.
var StateEventEmitter = ( function () {
    var guid = 0;

    // <a class="icon-link"
    //    name="state-event-emitter"
    //    href="#state-event-emitter"></a>
    // 
    // ### Constructor
    function StateEventEmitter ( state, type ) {
        this.state = state;
        this.type = type;
        this.items = {};
        this.length = 0;
    }

    // <a class="icon-link"
    //    name="state-event-emitter--prototype"
    //    href="#state-event-emitter--prototype"></a>
    // 
    // ### Prototype methods
    O.assign( StateEventEmitter.prototype, {

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--guid"
        //    href="#state-event-emitter--prototype--guid"></a>
        // 
        // #### guid
        // 
        // Produces a unique numeric string, to be used as a key for bound
        // event listeners.
        guid: function () {
            return ( guid += 1 ).toString();
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--get"
        //    href="#state-event-emitter--prototype--get"></a>
        // 
        // #### get
        // 
        // Retrieves a bound listener associated with the provided `id` string
        // as returned by the prior call to
        // [`add`](#state-event-emitter--prototype--add).
        get: function ( /*String*/ id ) {
            return this.items[ id ];
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--get-all"
        //    href="#state-event-emitter--prototype--get-all"></a>
        // 
        // #### getAll
        // 
        // Returns an array of all bound listeners.
        getAll: function () {
            var i, items = this.items, result = [];
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--set"
        //    href="#state-event-emitter--prototype--set"></a>
        // 
        // #### set
        // 
        // Adds or replaces a handler bound to a specific key.
        set: function (
                       /*String*/ id,
            /*Function | String*/ handler
        ) {
            var items = this.items;
            O.hasOwn.call( items, id ) || this.length++;
            items[ id ] = handler;
            return id;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--key"
        //    href="#state-event-emitter--prototype--key"></a>
        // 
        // #### key
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( /*Function*/ listener ) {
            var i, items = this.items;
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                if ( items[i] === listener ) return i;
            }
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--keys"
        //    href="#state-event-emitter--prototype--keys"></a>
        // 
        // #### keys
        // 
        // Returns the set of `id` strings associated with all bound listeners.
        keys: function () {
            var i, items = this.items, result = [];

            result.toString = function () { return '[' + result.join() + ']'; };
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--add"
        //    href="#state-event-emitter--prototype--add"></a>
        // 
        // #### add
        // 
        // Binds a listener, along with an optional context object, to be
        // called when the the emitter
        // [`emit`](#state-event-emitter--prototype--emit)s an event.
        // Returns a unique key that can be used later to
        // [`remove`](#state-event-emitter--prototype--remove) the listener.
        // 
        // *Aliases:* **on bind**
        'add on bind': function (
            /*Function*/ fn,
              /*Object*/ context  // optional
        ) {
            var id = this.guid();
            this.items[ id ] =
                typeof context === 'object' ? [ fn, context ] : fn;
            this.length++;
            return id;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--remove"
        //    href="#state-event-emitter--prototype--remove"></a>
        // 
        // #### remove
        // 
        // Unbinds a listener. Accepts either the numeric string returned by
        // [`add`](#state-event-emitter--prototype--add) or a reference to
        // the function itself.
        // 
        // *Aliases:* **off unbind**
        'remove off unbind': function ( /*Function | String*/ id ) {
            var fn, i, l,
                items = this.items;

            fn = items[ typeof id === 'function' ? this.key( id ) : id ];
            if ( !fn ) return false;
            delete items[ id ];
            this.length--;
            return fn;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--empty"
        //    href="#state-event-emitter--prototype--empty"></a>
        // 
        // #### empty
        // 
        // Removes all listeners, and returns the number of listeners removed.
        empty: function () {
            var n = this.length, items, i;

            if ( n === 0 ) return 0;

            items = this.items;
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return n;
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--emit"
        //    href="#state-event-emitter--prototype--emit"></a>
        // 
        // #### emit
        // 
        // Invokes all bound listeners, with the provided array of `args`, and
        // in the context of the bound or provided `state`.
        // 
        // *Alias:* **trigger**
        'emit trigger': function (
            /*Array*/ args,  // optional
            /*State*/ state  // = this
        ) {
            var i, item, itemType, fn, context, target,
                items = this.items, type = this.type;

            state || ( state = this.state );

            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                item = items[i];
                itemType = O.type( item );

                if ( itemType === 'function' ) {
                    fn = item; context = state;
                }
                else if ( itemType === 'array' ) {
                    fn = item[0]; context = item[1];
                }

                // If `item` is a string or [`State`](#state), interpret this
                // as an implied transition to be instigated from the client
                // `State` after all the callbacks have been invoked.
                else if ( itemType === 'string' || item instanceof State ) {
                    target = item;
                    continue;
                }

                fn.apply( context, args );
                fn = context = null;
            }

            target && state.change( target );
        },

        // <a class="icon-link"
        //    name="state-event-emitter--prototype--destroy"
        //    href="#state-event-emitter--prototype--destroy"></a>
        // 
        // #### destroy
        // 
        destroy: function () {
            this.empty();
            delete this.state; delete this.items;
            return true;
        }
    });

    return StateEventEmitter;
}() );
