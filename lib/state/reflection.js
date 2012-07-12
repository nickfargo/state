O.assign( State.prototype, {
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
