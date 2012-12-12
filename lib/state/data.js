// ### [`state/data.js`](#state--data.js)

O.assign( State.privileged, {

    // #### [data](#state--privileged--data)
    // 
    // Either retrieves or edits a block of data associated with this state.
    // 
    // If called with no arguments, or with boolean arguments, `data` returns
    // a copy of the data attached to this state, including all data from
    // inherited states, unless specified otherwise by the inheritance flags
    // `viaSuper` and `viaProto`.
    //
    // If called with an object-typed argument, `data` edits the data held on
    // this state. For keys in `edit` whose values are set to the `NIL`
    // directive, the matching keys in the state’s data are deleted. If the
    // operation results in a change to the state’s data, a
    // [`mutate`](/api/#state--attributes--mutate) event is emitted for this
    // state.
    //
    // > [Data](/docs/#concepts--data)
    // > [data](/api/#state--methods--data)
    data: function ( attributes, data ) {
        return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
            var edit, delta, state, superstate, protostate;

            if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                edit = viaSuper; viaSuper = viaProto = false;
            } else {
                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );
            }

            if ( edit && attributes & MUTABLE && !O.isEmpty( edit ) ) {
                if ( attributes & VIRTUAL ) {
                    return this.realize().data( edit );
                }
                
                delta = O.delta( data, edit );
                if ( !this.__atomic__ && delta && !O.isEmpty( delta ) ) {
                    this.emit( 'mutate', [ edit, delta ], false );
                }

                return this;
            }
            else {
                return O.clone(
                    viaSuper && ( superstate = this.superstate() ) &&
                        superstate.data(),
                    viaProto && ( protostate = this.protostate() ) &&
                        protostate.data( false ),
                    data
                );
            }
        };
    },

    // #### [has](#state--privileged--has)
    // 
    has: function ( attributes, data ) {
        return function ( key, viaSuper, viaProto ) {
            var protostate, superstate;

            viaSuper === undefined && ( viaSuper = true );
            viaProto === undefined && ( viaProto = true );

            return !!(
                data && O.has( data, key )
                    ||
                viaProto && ( protostate = this.protostate() ) &&
                        protostate.has( key, false, true )
                    ||
                viaSuper && ( superstate = this.superstate() ) &&
                        superstate.has( key, true, viaProto )
            );
        };
    },

    // #### [get](#state--privileged--get)
    // 
    get: function ( attributes, data ) {
        return function ( key, viaSuper, viaProto ) {
            var protostate, superstate;
            
            viaSuper === undefined && ( viaSuper = true );
            viaProto === undefined && ( viaProto = true );

            return (
                data && O.lookup( data, key )
                    ||
                viaProto && ( protostate = this.protostate() ) &&
                        protostate.get( key, false, true )
                    ||
                viaSuper && ( superstate = this.superstate() ) &&
                        superstate.get( key, true, viaProto )
            );
        };
    },

    // #### [let](#state--privileged--let)
    // 
    'let': function ( attributes, data ) {
        return function ( key, value ) {
            var displaced, edit, delta;

            if ( !( attributes & MUTABLE ) ) {
                return; // should warn: attempted `let` on non-mutable state
            }

            if ( attributes & VIRTUAL ) {
                return this.realize()['let']( key, value );
            }

            // With no bound `data` (e.g. in a virtual state), an assignment
            // fails and returns. An attempted deletion returns `NIL`,
            // suggestive of the expression `delete data[key] === true`.
            if ( !data ) {
                return value === NIL ? NIL : undefined;
            }

            displaced = O.lookup( data, key );
            if ( displaced !== value ) {
                O.assign( data, key, value );
                O.assign( edit = {}, key, value );
                O.assign( delta = {}, key, displaced );
                this.emit( 'mutate', [ edit, delta ], false );
            }

            return value;
        };
    }
});

O.assign( State.prototype, {
    data: State.privileged.data( undefined, null ),
    has: State.privileged.has( undefined, null ),
    get: State.privileged.get( undefined, null ),
    'let': State.privileged['let']( undefined, null ),

    // #### [set](#state--prototype--set)
    // 
    set: function ( key, value ) {
        if ( !this.isMutable() ) return;

        this.isVirtual() && this.realize();

        // If no mutable property already exists along the superstate chain,
        // then default to a `let`.
        if ( !this.has( key, true, false ) ) return this['let']( key, value );

        // Find the superstate that holds the inherited property and mutate it.
        for ( var s = this; s; s = s.superstate() ) {
            if ( s.isMutable() && s.has( key, false, false ) ) {
                return s['let']( key, value );
            }
        }
    },

    // #### [delete](#state--prototype--delete)
    // 
    'delete': function ( key ) {
        return this['let']( key, NIL ) === NIL;
    }
});
