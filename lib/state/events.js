// ### [`state/events.js`](#state--events.js)

O.assign( State.privileged, {

    // #### [event](#state--privileged--event)
    // 
    // Returns a registered event listener, or the number of listeners
    // registered, for a given event `type`.
    // 
    // If an `id` as returned by [`addEvent`](#state--privileged--add-event) is
    // provided, the event listener associated with that `id` is returned. If no
    // `id` is provided, the number of event listeners registered to `type` is
    // returned.
    //
    // > [event](/api/#state--methods--event)
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

    // #### [addEvent](#state--privileged--add-event)
    // 
    // Binds an event listener to the specified `eventType` and returns a unique
    // identifier for the listener. Built-in event types are listed at
    // `STATE_EVENT_TYPES`.
    // 
    // *Aliases:* **on**, **bind**
    //
    // > [addEvent](/api/#state--methods--add-event)
    addEvent: function ( events ) {
        return function (
              /*String*/ eventType,
            /*Function*/ fn,
              /*Object*/ context    // = this
        ) {
            if ( !O.hasOwn.call( events, eventType ) ) {
                events[ eventType ] = new StateEventEmitter( this, eventType );
            }

            return events[ eventType ].add( fn, context );
        };
    },

    // #### [removeEvent](#state--privileged--remove-event)
    // 
    // Unbinds the event listener with the specified `id` that was supplied by
    // [`addEvent`](#state--privileged--add-event).
    // 
    // *Aliases:* **off**, **unbind**
    //
    // > [removeEvent](/api/#state--methods--remove-event)
    removeEvent: function ( events ) {
        return function ( /*String*/ eventType, /*String*/ id ) {
            return events[ eventType ].remove( id );
        };
    },

    // #### [emit](#state--privileged--emit)
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
    //
    // > [emit](/api/#state--methods--emit)
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

            !args && ( args = [] ) || O.isArray( args ) || ( args = [ args ] );
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

O.assign( State.prototype, {
    'event addEvent removeEvent emit trigger': O.noop
});
