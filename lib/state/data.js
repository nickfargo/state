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
    data: function (
        /*Number*/ attributes,
        /*Object*/ data
    ) {
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
    }
});

State.prototype.data = State.privileged.data( undefined, null );
