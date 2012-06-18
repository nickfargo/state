// <a class="icon-link"
//    name="state--substates.js"
//    href="#state--substates.js"></a>
// 
// ### `state/substates.js`

Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--substate"
    //    href="#state--privileged--substate"></a>
    // 
    // #### substate
    // 
    // Retrieves the named substate of `this` state. If no such substate
    // exists in the local state, any identically named substate held on a
    // protostate will be returned.
    substate: function ( attributes, substates ) {
        return function (
             /*String*/ stateName,
            /*Boolean*/ viaProto    // = true
        ) {
            var s = this.current(),
                ss, protostate;

            viaProto === undefined && ( viaProto = true );

            // First scan for any virtual substates that are active on the
            // local controller.
            for ( ; s && s.isVirtual() && ( ss = s.superstate() ); s = ss ) {
                if ( ss === this && s.name() === stateName ) return s; 
            }

            // Otherwise retrieve a real substate, either locally or from a
            // protostate.
            return (
                substates && substates[ stateName ]
                    ||
                viaProto && ( protostate = this.protostate() ) &&
                        protostate.substate( stateName )
                    ||
                undefined
            );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--substates"
    //    href="#state--privileged--substates"></a>
    // 
    // #### substates
    // 
    // Returns an `Array` of this state’s substates. If the boolean `deep`
    // argument is `true`, returns a depth-first flattened array containing all
    // of this state’s descendant states.
    substates: function ( attributes, substates ) {
        return function (
            /*Boolean*/ deep,    // = false
            /*Boolean*/ virtual  // = false
        ) {
            var result = [],
                s, ss, key;

            // Include virtual substates, if present.
            if ( virtual ) {
                s = this.current();
                if ( s && s.isVirtual() && this.isSuperstateOf( s ) ) {
                    while ( s && s !== this && s.isVirtual() &&
                           ( ss = s.superstate() )
                    ) {
                        deep ?
                            result.unshift( s ) :
                            ss === this && result.unshift( s );
                        s = ss;
                    }
                }
            }

            // Include real substates.
            for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
                result.push( substates[ key ] );
                if ( deep ) {
                    result = result.concat( substates[ key ].substates( true ) );
                }
            }

            return result;
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--add-substate"
    //    href="#state--privileged--add-substate"></a>
    // 
    // #### addSubstate
    // 
    // Creates a state from the supplied `stateExpression` and adds it as a
    // substate of this state. If a substate with the same `stateName` already
    // exists, it is first destroyed and then replaced. If the new substate is
    // being added to the controller’s root state, a reference is added
    // directly on the controller itself as well.
    addSubstate: function ( attributes, substates ) {
        return function (
                                      /*String*/ stateName,
            /*StateExpression | Object | State*/ stateExpression
        ) {
            var substate, controller;

            if ( ~attributes & MUTABLE ) {
                "catch!";
            }
            if ( stateExpression instanceof State &&
                 stateExpression.isVirtual() &&
                 stateExpression.superstate() === this &&
                 stateExpression.protostate().superstate().isProtostateOf( this )
            ) {
                "catch!";
            }

            if ( attributes & VIRTUAL ) {
                return this.realize().addSubstate( stateName, stateExpression );
            }
            if ( attributes & SEALED ) return null;

            ( substate = substates[ stateName ] ) && substate.destroy();

            substate = stateExpression instanceof State ?
                stateExpression.superstate() === this &&
                    stateExpression.realize()
                :
                new State( this, stateName, stateExpression );

            if ( !substate ) return null;

            this[ stateName ] = substates[ stateName ] = substate;

            controller = this.controller();
            if ( controller.root() === this ) {
                controller[ stateName ] = substate;
            }

            return substate;
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--remove-substate"
    //    href="#state--privileged--remove-substate"></a>
    // 
    // #### removeSubstate
    // 
    // Removes the named substate from the local state, if possible.
    removeSubstate: function ( attributes, substates ) {
        return function ( /*String*/ stateName ) {
            var controller, current, transition,
                substate = substates[ stateName ];

            if ( !substate ) return;

            controller = this.controller();
            current = controller.current();

            // If a transition is underway involving `substate`, the removal
            // will fail.
            transition = controller.transition();
            if ( transition && (
                    substate.isSuperstateOf( transition ) ||
                    substate === transition.origin() ||
                    substate === transition.target()
                )
            ) {
                return false;
            }

            // The controller must be forced to evacuate the state before it is
            // removed.
            if ( current.isIn( substate ) ) {
                controller.change( this, { forced: true } );
            }

            delete substates[ stateName ];
            delete this[ stateName ];
            controller.root() === this && delete controller[ stateName ];

            return substate;
        };
    }
});

Z.privilege( State.prototype, State.privileged, {
    'substate substates': [ null ]
});
Z.assign( State.prototype, {
    'addSubstate removeSubstate': Z.noop
});
