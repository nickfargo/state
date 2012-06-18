// ### Model

Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--superstate"
    //    href="#state--privileged--superstate"></a>
    // 
    // #### superstate
    // 
    // Returns the immediate superstate, or the nearest state in the superstate
    // chain with the provided `stateName`.
    superstate: function ( /*State*/ superstate ) {
        return function (
            /*String*/ stateName // optional
        ) {
            return stateName === undefined ?
                superstate
                :
                superstate ?
                    stateName ?
                        superstate.name() === stateName ?
                            superstate : superstate.superstate( stateName )
                        :
                        this.controller().root()
                    :
                    undefined;
        }
    }
});

Z.assign( State.prototype, {

    // <a class="icon-link"
    //    name="state--prototype--owner"
    //    href="#state--prototype--owner"></a>
    // 
    // #### owner
    // 
    // Gets the owner object to which this state’s controller belongs.
    owner: function () {
        var controller = this.controller();
        if ( controller ) return controller.owner();
    },

    // <a class="icon-link"
    //    name="state--prototype--controller"
    //    href="#state--prototype--controller"></a>
    // 
    // #### controller
    // 
    // Gets the [`StateController`](#state-controller) to which this state
    // belongs.
    controller: function () {
        var superstate = this.superstate();
        if ( superstate ) return superstate.controller();
    },

    // <a class="icon-link"
    //    name="state--prototype--root"
    //    href="#state--prototype--root"></a>
    // 
    // #### root
    // 
    // Gets the root state, i.e. the top-level superstate of this state.
    root: function () {
        var controller = this.controller();
        if ( controller ) return controller.root();
    },

    // <a class="icon-link"
    //    name="state--prototype--superstate"
    //    href="#state--prototype--superstate"></a>
    // 
    // #### superstate
    // 
    // The `superstate` method is created on each non-root `State` instance
    // using the method factory at `State.privileged`.
    superstate: Z.noop,

    // <a class="icon-link"
    //    name="state--prototype--derivation"
    //    href="#state--prototype--derivation"></a>
    // 
    // #### derivation
    // 
    // Returns an object array of this state’s superstate chain, starting after
    // the root state and ending at `this`. If `byName` is set to `true`, a
    // string array of the states’ names is returned instead.
    derivation: function ( /*Boolean*/ byName ) {
        var result = [], s, ss = this;
        while ( ( s = ss ) && ( ss = s.superstate() ) ) {
            result.unshift( byName ? s.name() || '' : s );
        }
        return result;
    },

    // <a class="icon-link"
    //    name="state--prototype--depth"
    //    href="#state--prototype--depth"></a>
    // 
    // #### depth
    // 
    // Returns the number of superstates this state has. The root state returns
    // `0`, its immediate substates return `1`, etc.
    depth: function () {
        var n = 0, s = this;
        while ( s = s.superstate() ) n++;
        return n;
    },

    // <a class="icon-link"
    //    name="state--prototype--common"
    //    href="#state--prototype--common"></a>
    // 
    // #### common
    // 
    // Returns the least common ancestor of `this` and `other`. If `this` is
    // itself an ancestor of `other`, or vice versa, that ancestor is returned.
    common: function ( /*State | String*/ other ) {
        var state;

        other instanceof State || ( other = this.query( other ) );

        if ( this.depth() > other.depth() ) {
            state = other; other = this;
        } else {
            state = this;
        }
        while ( state ) {
            if ( state === other || state.isSuperstateOf( other ) ) {
                return state;
            }
            state = state.superstate();
        }
    },

    // <a class="icon-link"
    //    name="state--prototype--is"
    //    href="#state--prototype--is"></a>
    // 
    // #### is
    // 
    // Determines whether `this` is `state`.
    is: function ( /*State | String*/ state ) {
        state instanceof State || ( state = this.query( state ) );
        return state === this;
    },

    // <a class="icon-link"
    //    name="state--prototype--is-in"
    //    href="#state--prototype--is-in"></a>
    // 
    // #### isIn
    // 
    // Determines whether `this` is or is a substate of `state`.
    isIn: function ( /*State | String*/ state ) {
        state instanceof State || ( state = this.query( state ) );
        return state === this || state.isSuperstateOf( this );
    },

    // <a class="icon-link"
    //    name="state--prototype--has"
    //    href="#state--prototype--has"></a>
    // 
    // #### has
    // 
    // Determines whether `this` is or is a superstate of `state`.
    has: function ( /*State | String */ state ) {
        state instanceof State || ( state = this.query( state ) );
        return this === state || this.isSuperstateOf( state );
    },

    // <a class="icon-link"
    //    name="state--prototype--is-superstate-of"
    //    href="#state--prototype--is-superstate-of"></a>
    // 
    // #### isSuperstateOf
    // 
    // Determines whether `this` is a superstate of `state`.
    isSuperstateOf: function ( /*State | String*/ state ) {
        var superstate;
        state instanceof State || ( state = this.query( state ) );

        return ( superstate = state.superstate() ) ?
            this === superstate || this.isSuperstateOf( superstate ) :
            false;
    },

    // <a class="icon-link"
    //    name="state--prototype--protostate"
    //    href="#state--prototype--protostate"></a>
    // 
    // #### protostate
    // 
    // Returns the **protostate**, the state analogous to `this` found in the
    // next object in the owner’s prototype chain that has one. A state
    // inherits first from its protostates, then from its superstates.
    // 
    // If the owner does not share an analogous
    // [`StateController`](#state-controller) with its prototype, or if no
    // protostate can be found in the hierarchy of the prototype’s state
    // controller, then the search is iterated up the prototype chain.
    // 
    // A state and its protostate will always share an identical name and
    // identical derivation pattern, as will the respective superstates of
    // both, relative to one another.
    protostate: ( function () {
        var memoize;
        
        if ( meta.options.memoizeProtostates ) {
            memoize = function ( protostate ) {
                return function () {
                    // If `destroyed` has been set, it means we’re hanging onto
                    // an invalid reference. Removing this method from the
                    // instance will clear the reference for GC. This
                    // invocation can then be relayed back up to
                    // [`State.prototype.protostate`](#state--prototype--protostate).
                    if ( protostate.destroyed ) {
                        delete this.protostate;
                        return this.protostate();
                    }
                    else return protostate;
                };
            };
        }

        return function () {
            var derivation = this.derivation( true ),
                controller = this.controller(),
                controllerName, prototype, next, protostate, i, l;

            if ( !controller ) return;

            controllerName = controller.name();
            prototype = controller.owner();

            // Returns the root state of the next `prototype` in the chain.
            next = function () {
                var fn, s;
                return ( prototype = Z.getPrototypeOf( prototype ) ) &&
                    Z.isFunction( fn = prototype[ controllerName ] ) &&
                    ( s = fn.apply( prototype ) ) instanceof State &&
                    s.root();
            };

            // Walk up the prototype chain; starting at each prototype’s root
            // state, locate the protostate that corresponds to `this`.
            while ( protostate = next() ) {
                for ( i = 0, l = derivation.length; i < l; i++ ) {
                    protostate = protostate.substate( derivation[i], false );
                    if ( !protostate ) break;
                }

                if ( protostate ) {
                    // Before returning the located protostate, memoize
                    // subsequent lookups with an instance method that closes
                    // over it.
                    memoize && ( this.protostate = memoize( protostate ) );

                    return protostate;
                }
            }
        };
    }() ),

    // <a class="icon-link"
    //    name="state--prototype--is-protostate-of"
    //    href="#state--prototype--is-protostate-of"></a>
    // 
    // #### isProtostateOf
    // 
    // Determines whether `this` is a state analogous to `state` on any object
    // in the prototype chain of `state`’s owner.
    isProtostateOf: function ( /*State | String*/ state ) {
        var protostate;
        state instanceof State || ( state = this.query( state ) );

        return ( protostate = state.protostate() ) ?
            this === protostate || this.isProtostateOf( protostate ) :
            false;
    },

    // <a class="icon-link"
    //    name="state--substates--default-substate"
    //    href="#state--substates--default-substate"></a>
    // 
    // #### defaultSubstate
    // 
    // Returns the first substate marked `default`, or simply the first
    // substate. Recursion continues into the protostate only if no local
    // descendant states are marked `initial`.
    defaultSubstate: function (
        /*Boolean*/ viaProto, // = true
                       first
    ) {
        var substates = this.substates(),
            i = 0, l = substates && substates.length,
            protostate;

        first || l && ( first = substates[0] );
        for ( ; i < l; i++ ) {
            if ( substates[i].isDefault() ) return substates[i];
        }

        if ( viaProto || viaProto === undefined ) {
            protostate = this.protostate();
            if ( protostate ) return protostate.defaultSubstate( true, first );
        }

        return first;
    },

    // <a class="icon-link"
    //    name="state--substates--initial-substate"
    //    href="#state--substates--initial-substate"></a>
    // 
    // #### initialSubstate
    // 
    // Performs a “depth-within-breadth-first” recursive search to locate the
    // most deeply nested `initial` state by way of the greatest `initial`
    // descendant state. Recursion continues into the protostate only if no
    // local descendant states are marked `initial`.
    initialSubstate: function (
        /*Boolean*/ viaProto // = true
    ) {
        var queue = [ this ],
            subject, substates, i, l, state, protostate;

        while ( subject = queue.shift() ) {
            substates = subject.substates( false, true );
            for ( i = 0, l = substates.length; i < l; i++ ) {
                state = substates[i];
                if ( state.isInitial() ) {
                    return state.initialSubstate( false ) || state;
                }
                queue.push( state );
            }
        }

        if ( viaProto || viaProto === undefined ) {
            protostate = this.protostate();
            if ( protostate ) return protostate.initialSubstate( true );
        }
    },

    // <a class="icon-link"
    //    name="state--prototype--to-string"
    //    href="#state--prototype--to-string"></a>
    // 
    // #### toString
    // 
    // Returns this state’s fully qualified name.
    toString: function () {
        return this.derivation( true ).join('.');
    }
});
