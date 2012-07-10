// <a class="icon-link"
//    name="state--data.js"
//    href="#state--data.js"></a>
// 
// ### `state/data.js`

O.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--data"
    //    href="#state--privileged--data"></a>
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
                    this.push( 'delta', this, null, delta );
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

O.assign( State.prototype, {
    data: State.privileged.data( undefined, null ),

    // #### reflect
    //
    // Copies this state’s `data` into the owner object, with the exception of
    // any properties that would collide with the owner’s accessor and
    // delegator methods.
    reflect: function () {
        var owner = this.owner(),
            data = this.data(),
            key, fn;

        if ( O.isEmpty( data ) ) return owner;

        // Always retain the owner’s accessor method and delegator methods.
        for ( key in owner ) if ( O.hasOwn.call( owner, key ) ) {
            fn = owner[ key ];
            if ( O.isFunction( fn ) && ( fn.isDelegator || fn.isAccessor ) ) {
                data[ key ] = fn;
            }
        }
        return O.edit( 'absolute delta', owner, data );
    },

    // #### soak
    //
    // Copies owner properties into this state’s `data`. Conjugate of
    // `reflect`.
    soak: function () {
        var owner, copy, diff, key, fn;

        if ( !this.isMutable() ) return;

        owner = this.owner();
        copy = {};

        // Exclude the owner’s accessor method and delegator methods.
        for ( key in owner ) if ( O.hasOwn.call( owner, key ) ) {
            fn = owner[ key ];
            if ( !O.isFunction( fn ) || !fn.isDelegator && !fn.isAccessor ) {
                copy[ key ] = fn;
            }
        }

        // First get a comparison of the state’s existing `data` to the owner.
        diff = O.diff( copy, this.data() );

        // `soak` is non-destructive, so erase the `NIL`s from `diff` by
        // applying it to itself before applying it to the state’s `data`.
        O.edit( 'deep', diff, diff );

        this.data( diff );

        return diff;
    }
});
