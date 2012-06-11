// ### Data
//
Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--data--data"
    //    href="#state--data--data"></a>
    // 
    // #### data
    // 
    // Either retrieves or edits a block of data associated with this state.
    // 
    // `data( [Boolean viaSuper], [Boolean viaProto] )`
    // 
    // Retrieves data attached to this state, including all data from inherited
    // states, unless specified otherwise by the inheritance flags `viaSuper`
    // and `viaProto`.
    // 
    // `data( Object edit )`
    // 
    // Edits data on this state. For keys in `edit` whose values are set to the
    // `NIL` directive, the matching keys in `data` are deleted. If the
    // operation results in a change to `data`, a `mutate` event is emitted for
    // this state.
    data: function (
        /*Number*/ attributes,
        /*Object*/ data
    ) {
        return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
            var edit, delta, state, superstate, protostate;

            if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                edit = viaSuper, viaSuper = viaProto = false;
            } else {
                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );
            }

            if ( edit && attributes & MUTABLE && !Z.isEmpty( edit ) ) {
                if ( attributes & VIRTUAL ) {
                    return this.realize().data( edit );
                }
                
                delta = Z.delta( data, edit );
                if ( !this.__atomic__ && delta && !Z.isEmpty( delta ) ) {
                    this.push( 'delta', this, null, delta );
                    this.emit( 'mutate', [ edit, delta ], false );
                }
            }
            else {
                return Z.clone(
                    viaSuper && ( superstate = this.superstate() ) &&
                        superstate.data(),
                    viaProto && ( protostate = this.protostate() ) &&
                        protostate.data( false ),
                    data
                );
            }

            return this;
        }
    }
});

State.prototype.data = State.privileged.data( undefined, null );
