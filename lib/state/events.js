// <a class="icon-link"
//    name="state--events.js"
//    href="#state--events.js"></a>
// 
// ### `state/events.js`

Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--event"
    //    href="#state--privileged--event"></a>
    // 
    // #### event
    // 
    // Returns a registered event listener, or the number of listeners
    // registered, for a given event `type`.
    // 
    // If an `id` as returned by [`addEvent`](#state--privileged--add-event) is
    // provided, the event listener associated with that `id` is returned. If no
    // `id` is provided, the number of event listeners registered to `type` is
    // returned.
    event: function ( events ) {
        return function (
                    /*String*/ eventType,
         /*String | Function*/ id
        ) {
            var emitter = events[ eventType ];

            if ( emitter == null ) return;
            if ( id === undefined ) return emitter.length;

            typeof id === 'function' && ( id = emitter.key( id ) );
            return emitter.get( id );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--add-event"
    //    href="#state--privileged--add-event"></a>
    // 
    // #### addEvent
    // 
    // Binds an event listener to the specified `eventType` and returns a unique
    // identifier for the listener. Built-in event types are listed at
    // `STATE_EVENT_TYPES`.
    // 
    // *Aliases:* **on**, **bind**
    addEvent: function ( events ) {
        return function (
              /*String*/ eventType,
            /*Function*/ fn,
              /*Object*/ context    // = this
        ) {
            if ( !Z.hasOwn.call( events, eventType ) ) {
                events[ eventType ] = new StateEventEmitter( this, eventType );
            }

            return events[ eventType ].add( fn, context );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--remove-event"
    //    href="#state--privileged--remove-event"></a>
    // 
    // #### removeEvent
    // 
    // Unbinds the event listener with the specified `id` that was supplied by
    // [`addEvent`](#state--privileged--add-event).
    // 
    // *Aliases:* **off**, **unbind**
    removeEvent: function ( events ) {
        return function ( /*String*/ eventType, /*String*/ id ) {
            return events[ eventType ].remove( id );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--emit"
    //    href="#state--privileged--emit"></a>
    // 
    // #### emit
    // 
    // Invokes all listeners bound to the given event type.
    //
    // Arguments for the listeners can be passed as an array to the `args`
    // parameter.
    // 
    // Callbacks are invoked in the context of `this`, or as specified by
    // `context`.
    // 
    // Callbacks bound to superstates and protostates are also invoked, unless
    // otherwise directed by setting `viaSuper` or `viaProto` to `false`.
    // 
    // *Alias:* **trigger**
    emit: function ( events ) {
        return function (
             /*String*/ eventType,
              /*Array*/ args,      // = []
              /*State*/ context,   // = this
            /*Boolean*/ viaSuper,  // = true
            /*Boolean*/ viaProto   // = true
        ) {
            var e, protostate, superstate;

            if ( typeof eventType !== 'string' ) return;

            if ( typeof args === 'boolean' ) {
                viaProto = viaSuper;
                viaSuper = context;
                context = args;
                args = undefined;
            }
            if ( typeof context === 'boolean' ) {
                viaProto = viaSuper;
                viaSuper = context;
                context = undefined;
            }

            !args && ( args = [] ) || Z.isArray( args ) || ( args = [ args ] );
            viaSuper === undefined && ( viaSuper = true );
            viaProto === undefined && ( viaProto = true );

            ( e = events[ eventType ] ) && e.emit( args, context || this );

            viaProto && ( protostate = this.protostate() ) &&
                protostate.emit( eventType, args, context || this, false );

            viaSuper && ( superstate = this.superstate() ) &&
                superstate.emit( eventType, args, context || superstate );
        };
    }
});

Z.assign( State.prototype, {
    'event addEvent removeEvent emit trigger': Z.noop
});
