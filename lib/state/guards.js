// ### Guards
//
Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--guards--guard"
    //    href="#state--guards--guard"></a>
    // 
    // #### guard
    // 
    // Gets a **guard** entity for this state. A guard is a value or function
    // that will be evaluated, as either a boolean or predicate, respectively,
    // to provide a determination of whether a controller will be admitted into
    // or released from the state to which the guard is applied. Guards are
    // inherited from protostates, but not from superstates.
    // 
    // *See also:* [`StateController evaluateGuard`](#state-controller--private--evaluate-guard)
    guard: function ( guards ) {
        return function ( /*String*/ guardType ) {
            var guard, protostate;

            return (
                ( guard = guards[ guardType ] ) && Z.clone( guard )
                    ||
                ( protostate = this.protostate() ) &&
                        protostate.guard( guardType )
                    ||
                undefined
            );
        };
    },

    // <a class="icon-link"
    //    name="state--guards--add-guard"
    //    href="#state--guards--add-guard"></a>
    // 
    // #### addGuard
    // 
    // Adds a guard to this state, or augments an existing guard with additional
    // entries.
    addGuard: function ( guards ) {
        return function ( /*String*/ guardType, /*Object*/ guard ) {
            return Z.edit(
                guards[ guardType ] || ( guards[ guardType ] = {} ),
                guard
            );
        };
    },

    // <a class="icon-link"
    //    name="state--guards--remove-guard"
    //    href="#state--guards--remove-guard"></a>
    // 
    // #### removeGuard
    // 
    // Removes a guard from this state, or removes specific entries from an
    // existing guard.
    removeGuard: function ( guards ) {
        return function (
                    /*String*/ guardType
            /*Array | String*/ /* keys... */
        ) {
            var guard, keys, i, l, key, entry;

            guard = guards[ guardType ];
            if ( !guard ) return null;

            if ( arguments.length < 2 ) {
                return delete guards[ guardType ] ? guard : undefined;
            }

            keys = Z.flatten( Z.slice.call( arguments, 1 ) );
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

Z.assign( State.prototype, {
    'guard addGuard removeGuard': Z.noop
});
