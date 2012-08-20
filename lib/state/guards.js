// ### [`state/guards.js`](#state--guards.js)

O.assign( State.privileged, {

    // #### [guard](#state--privileged--guard)
    // 
    // Gets a **guard** entity for this state. A guard is a value or function
    // that will be evaluated, as either a boolean or predicate, respectively,
    // to provide a determination of whether a controller will be admitted into
    // or released from the state to which the guard is applied. Guards are
    // inherited from protostates, but not from superstates.
    // 
    // > See also: [`StateController evaluateGuard`](#state-controller--private--evaluate-guard)
    //
    // > [guard](/api/#state--methods--guard)
    guard: function ( guards ) {
        return function ( /*String*/ guardType ) {
            var guard, protostate;

            return (
                ( guard = guards[ guardType ] ) && O.clone( guard )
                    ||
                ( protostate = this.protostate() ) &&
                        protostate.guard( guardType )
                    ||
                undefined
            );
        };
    },

    // #### [addGuard](#state--privileged--add-guard)
    // 
    // Adds a guard to this state, or augments an existing guard with additional
    // entries.
    //
    // > [addGuard](/api/#state--methods--add-guard)
    addGuard: function ( guards ) {
        return function ( /*String*/ guardType, /*Object*/ guard ) {
            return O.edit(
                guards[ guardType ] || ( guards[ guardType ] = {} ),
                guard
            );
        };
    },

    // #### [removeGuard](#state--privileged--remove-guard)
    // 
    // Removes a guard from this state, or removes specific entries from an
    // existing guard.
    //
    // > [removeGuard](/api/#state--methods--remove-guard)
    removeGuard: function ( guards ) {
        return function (
                    /*String*/ guardType
            /*Array | String*/ /* keys... */
        ) {
            var guard, keys, i, l, key, entry;

            guard = guards[ guardType ];
            if ( !guard ) return null;

            if ( arguments.length < 2 ) {
                return ( delete guards[ guardType ] ) ? guard : undefined;
            }

            keys = O.flatten( O.slice.call( arguments, 1 ) );
            for ( i = 0, l = keys.length; i < l; i++ ) {
                key = keys[i];
                if ( typeof key === 'string' ) {
                    entry = guard[ key ];
                    if ( delete guard[ key ] ) return entry;
                }
            }
        };
    }
});

O.assign( State.prototype, {
    'guard addGuard removeGuard': O.noop
});
