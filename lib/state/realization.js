// ### [`state/realization.js`](#state--realization.js)
//
// Methods for realizing an incipient or virtual `State` instance.

// #### [realize](#state--private--realize)
// 
// Continues construction of an incipient [`State`](#state), or equivalently,
// converts a virtual state into a *real* state.
// 
// Much of the initialization for `State` is offloaded from the
// [constructor](#state--constructor), allowing for creation of lightweight
// virtual `State` instances that inherit all of their functionality from
// protostates, but can also be converted at some later time to a real `State`
// if necessary.
// 
// > See also:
// > [`State constructor`](#state--constructor),
// > [`StateController virtualize`](#state-controller--private--virtualize),
// > [`State.privileged.realize`](#state--privileged--realize)
function realize ( superstate, attributes, expression ) {
    var owner, addMethod, key, method,
        self = this;

    // The real state’s private variables and collections.
    var data        = {},
        methods     = {},
        events      = {},
        guards      = {},
        substates   = {},
        transitions = {},
        history     = null;

    // Method names are mapped to specific local variables. The named
    // methods are created on `this`, each of which is a partial application
    // of its corresponding method factory at
    // [`State.privileged`](#state--privileged).
    O.privilege( this, privileged, {
        'peek express mutate' : [ StateExpression, attributes, data,
            methods, events, guards, substates, transitions, history ],
        'superstate' : [ superstate ],
        'attributes' : [ attributes ],
        'data' : [ attributes | MUTABLE, data ],
        'method methodNames addMethod removeMethod' : [ methods ],
        'event addEvent removeEvent emit' : [ events ],
        'guard addGuard removeGuard' : [ guards ],
        'substate substates addSubstate removeSubstate' : [ attributes,
            substates ],
        'transition transitions addTransition removeTransition' :
            [ transitions ],
        'destroy' : [ function ( s ) { return superstate = s; }, methods,
            events, substates ]
    });

    O.alias( this, {
        addEvent: 'on bind',
        removeEvent: 'off unbind',
        emit: 'trigger'
    });

    // With the instance methods in place, `this` is now ready to apply
    // `expression` to itself.
    privileged.init( StateExpression ).call( this, expression );

    // Realizing a root state requires that, for any of the owner’s own
    // methods for which exist at least one stateful implementation located
    // higher in its prototype chain, that method must be copied into the
    // root to define the object’s default behavior.
    if ( !superstate && ( owner = this.owner() ) ) {
        addMethod = this.addMethod;
        if ( !addMethod ) {
            addMethod = privileged.addMethod( methods );
        }

        for ( key in owner ) if ( O.hasOwn.call( owner, key ) ) {
            method = owner[ key ];
            O.isFunction( method ) && !method.isDelegator &&
                this.method( key, false ) &&
                addMethod.call( this, key, method );
        }
    }

    // If the state is `finite` or non-`mutable`, then the appropriate
    // mutation methods used during construction/realization can no longer
    // be used, and must be removed.
    if ( ~attributes & MUTABLE ) {
        O.forEach( 'mutate addMethod removeMethod addGuard removeGuard \
            addTransition removeTransition'.split(/\s+/),
            function ( m ) {
                delete self[ m ];
            });

        // An exception is `data`, which must be rewritten rather than removed.
        this.data = State.privileged.data( attributes, data );
    }
    if ( ~attributes & MUTABLE || attributes & FINITE ) {
        delete this.addSubstate;
        delete this.removeSubstate;
    }

    // Non-`mutable` and `finite` requires a special implementation of
    // `mutate` that disallows mutations to substates.
    if ( ~attributes & MUTABLE && attributes & FINITE ) {
        this.mutate = privileged.mutate( StateExpression, attributes, data,
            methods, events, guards, null, transitions );
    }

    // (Exposed for debugging.)
    O.env.debug && O.assign( this, {
        __private__: this.peek( __MODULE__ )
    });

    return this;
}

// #### [mutableVirtualMethods](#state--private--mutable-virtual-methods)
// 
// A set of methods that will be mixed into mutable virtual states. When
// called, these first [`realize`](#state--private--realize) the state and
// then, provided that realization has successfully produced a new method
// of the same name on the instance, invoke that method.
var mutableVirtualMethods = ( function () {
    var obj = {},
        names = 'addMethod addEvent addGuard addSubstate addTransition';

    O.forEach( names.split(' '), function ( name ) {
        function realizer () {
            var method = this.realize()[ name ];
            if ( method !== realizer ) {
                return method.apply( this, arguments );
            }
        }
        obj[ name ] = realizer;
    });

    return obj;
}() );

// #### [realize](#state--privileged--realize)
// 
// Transforms a virtual state into a “real” state.
// 
// A virtual state is a lightweight [`State`](#state) instance whose
// purpose is simply to inherit from its protostate. As such virtual states
// are weakly bound to a state hierarchy by their reference held at
// `superstate`, and are not proper members of the superstate’s set of
// substates. Transforming the state from virtual to real causes it to
// exist thereafter as an abiding member of its superstate’s set of
// substates.
// 
// > See also: [`State realize`](#state--private--realize)
//
// > [realize](/api/#state--methods--realize)
State.privileged.realize = function ( attributes ) {
    return function ( expression ) {
        var superstate = this.superstate(),
            addSubstate = O.hasOwn.call( superstate, 'addSubstate' ) ?
                superstate.addSubstate :
                privileged.addSubstate(
                    superstate.peek( __MODULE__, 'attributes' ),
                    superstate.peek( __MODULE__, 'substates' )
                );
        delete this.realize;
        if ( addSubstate.call( superstate, this.name(), this ) ) {
            realize.call( this, superstate, attributes & ~VIRTUAL,
                expression );
        }
        return this;
    };
};

O.assign( State.prototype, {

    // #### [virtualize](#state--prototype--virtualize)
    // 
    // Creates, if necessary, a virtual state within the state hierarchy of
    // `inheritor` to represent `this` protostate, along with as many virtual
    // superstates as are necessary to reach a real [`State`](#state) in the
    // hierarchy of `inheritor`.
    //
    // Returns the state on `inheritor`’s state tree for which `this` is a
    // protostate. This will be the newly created virtual state, unless
    // virtualization was unnecessary, in which case it will be the already
    // existent real **epistate** of `this`.
    //
    // > [Protostates](/docs/#concepts--inheritance--protostates)
    virtualize: function ( inheritor ) {
        var derivation, i, s, real, name;
        
        // Verify that `inheritor`’s owner does indeed inherit from the owner
        // of `this`.
        if ( !( inheritor instanceof State && this.owner().isPrototypeOf(
            inheritor.owner() ) ) ) return null;

        // Get the [derivation](/api/#state--methods--derivation) list for
        // `this`.
        derivation = this.derivation( true );
        if ( !derivation.length ) return null;

        // Traverse the real states of the inheriting state tree to their
        // furthest depth.
        i = 0; s = inheritor.root();
        while ( ( name = derivation[ i++ ] ) &&
                ( real = s.substate( name, false ) ) ) {
            s = real;
        }

        // If `derivation` extends beyond the inheriting state tree’s real
        // states, then add virtual states to it until the whole superstate
        // chain is represented.
        while ( name ) {
            s = new State( s, name, {
                attributes: STATE_ATTRIBUTES.VIRTUAL
            });
            name = derivation[ i++ ];
        }

        return s;
    },

    realize: O.getThis
});
