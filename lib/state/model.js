// ### [`state/model.js`](#state--model.js)

O.assign( State.privileged, {

    // #### [superstate](#state--privileged--superstate)
    // 
    // Returns the immediate superstate, or the nearest state in the superstate
    // chain with the provided `stateName`.
    //
    // > [superstate](/api/#state--methods--superstate)
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
        };
    }
});

O.assign( State.prototype, {

    // #### [owner](#state--prototype--owner)
    // 
    // Gets the owner object to which this state’s controller belongs.
    //
    // > [owner](/api/#state--methods--owner)
    owner: function () {
        var controller = this.controller();
        if ( controller ) return controller.owner();
    },

    // #### [controller](#state--prototype--controller)
    // 
    // Gets the [`StateController`](#state-controller) to which this state
    // belongs.
    controller: function () {
        var superstate = this.superstate();
        if ( superstate ) return superstate.controller();
    },

    // #### [root](#state--prototype--root)
    // 
    // Gets the root state, i.e. the top-level superstate of this state.
    //
    // > [root](/api/#state--methods--root)
    root: function () {
        var controller = this.controller();
        if ( controller ) return controller.root();
    },

    // #### [superstate](#state--prototype--superstate)
    // 
    // The `superstate` method is overridden for non-root `State` instances
    // using [`State.privileged.superstate`](#state--privileged--superstate).
    //
    // > [superstate](/api/#state--methods--superstate)
    superstate: O.noop,

    // #### [derivation](#state--prototype--derivation)
    // 
    // Returns an object array of this state’s superstate chain, starting after
    // the root state and ending at `this`. If `byName` is set to `true`, a
    // string array of the states’ names is returned instead.
    //
    // > [derivation](/api/#state--methods--derivation)
    derivation: function ( /*Boolean*/ byName ) {
        var result = [], s, ss = this;
        while ( ( s = ss ) && ( ss = s.superstate() ) ) {
            result.unshift( byName ? s.name() || '' : s );
        }
        return result;
    },

    // #### [path](#state--prototype--path)
    // 
    // Returns this state’s fully qualified name.
    // 
    // *Alias:* **toString**
    //
    // > [path](/api/#state--methods--path)
    'path toString': function () {
        return this.derivation( true ).join('.');
    },

    // #### [depth](#state--prototype--depth)
    // 
    // Returns the number of superstates this state has. The root state returns
    // `0`, its immediate substates return `1`, etc.
    //
    // > [depth](/api/#state--methods--depth)
    depth: function () {
        var n = 0, s = this;
        while ( s = s.superstate() ) n++;
        return n;
    },

    // #### [common](#state--prototype--common)
    // 
    // Returns the least common ancestor of `this` and `other`. If `this` is
    // itself an ancestor of `other`, or vice versa, that ancestor is returned.
    //
    // > [common](/api/#state--methods--common)
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

    // #### [is](#state--prototype--is)
    // 
    // Determines whether `this` is `state`.
    //
    // > [is](/api/#state--methods--is)
    is: function ( /*State | String*/ state ) {
        state instanceof State || ( state = this.query( state ) );
        return state === this;
    },

    // #### [isIn](#state--prototype--is-in)
    // 
    // Determines whether `this` is or is a substate of `state`.
    //
    // > [isIn](/api/#state--methods--is-in)
    isIn: function ( /*State | String*/ state ) {
        state instanceof State || ( state = this.query( state ) );
        return state === this || state.isSuperstateOf( this );
    },

    // #### [has](#state--prototype--has)
    // 
    // Determines whether `this` is or is a superstate of `state`.
    //
    // > [has](/api/#state--methods--has)
    has: function ( /*State | String */ state ) {
        state instanceof State || ( state = this.query( state ) );
        return this === state || this.isSuperstateOf( state );
    },

    // #### [isSuperstateOf](#state--prototype--is-superstate-of)
    // 
    // Determines whether `this` is a superstate of `state`.
    //
    // > [isSuperstateOf](/api/#state--methods--is-superstate-of)
    isSuperstateOf: function ( /*State | String*/ state ) {
        var superstate;
        state instanceof State || ( state = this.query( state ) );
        return ( superstate = state.superstate() ) ?
            this === superstate || this.isSuperstateOf( superstate ) :
            false;
    },

    // #### [protostate](#state--prototype--protostate)
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
    //
    // > [protostate](/api/#state--methods--protostate)
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
                return ( prototype = O.getPrototypeOf( prototype ) ) &&
                    O.isFunction( fn = prototype[ controllerName ] ) &&
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

    // #### [isProtostateOf](#state--prototype--is-protostate-of)
    // 
    // Determines whether `this` is a state analogous to `state` on any object
    // in the prototype chain of `state`’s owner.
    //
    // > [isProtostateOf](/api/#state--methods--is-protostate-of)
    isProtostateOf: function ( /*State | String*/ state ) {
        var protostate;
        state instanceof State || ( state = this.query( state ) );
        return ( protostate = state.protostate() ) ?
            this === protostate || this.isProtostateOf( protostate ) :
            false;
    },

    // #### [defaultSubstate](#state--substates--default-substate)
    // 
    // Returns the first substate marked `default`, or simply the first
    // substate. Recursion continues into the protostate only if no local
    // substates are marked `default`.
    //
    // > [defaultSubstate](/api/#state--methods--default-substate)
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

    // #### [initialSubstate](#state--substates--initial-substate)
    // 
    // Performs a “depth-within-breadth-first” recursive search to locate the
    // most deeply nested `initial` state by way of the greatest `initial`
    // descendant state. Recursion continues into the protostate only if no
    // local descendant states are marked `initial`.
    //
    // > [initialSubstate](/api/#state--methods--initial-substate)
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
    }
});
