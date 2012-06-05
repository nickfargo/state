// ## StateController <a class="icon-link" name="state-controller" href="#state-controller"></a>
// 
// A **state controller** maintains the identity of the owner’s **current state**, and facilitates
// transitions from one state to another. It provides the behavior-modeling aspect of the owner’s
// state by forwarding method calls made on the owner to any associated stateful implementations
// of those methods that are valid given the current state.
var StateController = ( function () {

    // <a class="icon-link"
    //    name="state-controller--constructor"
    //    href="#state-controller--constructor"></a>
    // 
    // ### Constructor
    function StateController (
                          /*Object*/ owner,      // = {}
        /*StateExpression | Object*/ expression, // optional
                          /*Object*/ options     // optional
    ) {
        if ( !( this instanceof StateController ) ) {
            return new StateController( owner, expression, options );
        }

        var self = this,
            name, root, current, transition, defaultSubstate;

        function setCurrent ( value ) { return current = value; }
        function setTransition ( value ) { return transition = value; }

        // Validate arguments.
        owner || ( owner = {} );
        expression instanceof StateExpression ||
            ( expression = new StateExpression( expression ) );
        options === undefined && ( options = {} ) ||
            typeof options === 'string' && ( options = { initialState: options } );

        // Assign to `owner` an [accessor method](#state-controller--private--create-accessor)
        // that will serve as the owner’s interface into its state.
        name = options.name || 'state';
        owner[ name ] = createAccessor( owner, name, this );

        Z.assign( this, {
            // <a class="icon-link"
            //    name="state-controller--constructor--owner"
            //    href="#state-controller--constructor--owner"></a>
            // 
            // #### owner
            // 
            // Returns the owner object on whose behalf this controller acts.
            owner: Z.thunk( owner ),

            // <a class="icon-link"
            //    name="state-controller--constructor--name"
            //    href="#state-controller--constructor--name"></a>
            // 
            // #### name
            // 
            // Returns the name assigned to this controller. This is also the key in `owner` that
            // holds the `accessor` function associated with this controller.
            name: Z.stringFunction( function () { return name; } ),

            // <a class="icon-link"
            //    name="state-controller--constructor--current"
            //    href="#state-controller--constructor--current"></a>
            // 
            // #### current
            // 
            // Returns the controller’s current state, or currently active transition.
            current: Z.assign( function () { return current; }, {
                toString: function () {
                    if ( current ) return current.toString();
                }
            }),

            // <a class="icon-link"
            //    name="state-controller--constructor--change"
            //    href="#state-controller--constructor--change"></a>
            // 
            // #### change
            // 
            change: StateController.privileged.change( setCurrent, setTransition ),

            // <a class="icon-link"
            //    name="state-controller--constructor--transition"
            //    href="#state-controller--constructor--transition"></a>
            // 
            // #### transition
            // 
            // Returns the currently active transition, or `undefined` if the controller is not
            // presently engaged in a transition.
            transition: Z.assign( function () { return transition; }, {
                toString: function () {
                    if ( transition ) return transition.toString();
                }
            }),

            // <a class="icon-link"
            //    name="state-controller--constructor--destroy"
            //    href="#state-controller--constructor--destroy"></a>
            // 
            // #### destroy
            // 
            // Destroys this controller and all of its states, and returns the owner to its
            // original condition.
            destroy: function () {
                var result;
                delete this.destroy;
                transition && transition.abort();
                root.destroy();
                result = delete owner[ name ];
                owner = self = root = current = transition = null;
                return result;
            }
        });

        // Instantiate the root state, adding a redefinition of the `controller` method that points
        // directly to this controller, along with all of the members and substates outlined in
        // `expression`.
        root = new State( this, '', expression );

        // Establish which state should be the initial state and set the current state to that.
        current = root.initialSubstate() || root;
        options.initialState !== undefined && ( current = root.query( options.initialState ) );
        current.isAbstract() && ( defaultSubstate = current.defaultSubstate() ) &&
            ( current = defaultSubstate );
        current.controller() === this || ( current = virtualize.call( this, current ) );

        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this.__private__ = {}, {
            root: root,
            owner: owner,
            options: options
        });
    }

    // ### Class-private functions

    // <a class="icon-link"
    //    name="state-controller--private--create-accessor"
    //    href="#state-controller--private--create-accessor"></a>
    // 
    // #### createAccessor
    // 
    // Returns an `accessor` function, which will serve as an owner object’s interface to the
    // implementation of its state.
    function createAccessor ( owner, name, self ) {
        function accessor () {
            var fn, current;

            if ( this === owner ) {
                if ( Z.isFunction( fn = arguments[0] ) ) return self.change( fn.call( this ) );
                current = self.current();
                return arguments.length ? current.query.apply( current, arguments ) : current;
            }

            // Calling the accessor of a prototype means that `this` requires its own accessor
            // and [`StateController`](#state-controller). Creating a new `StateController` has
            // the desired side-effect of also creating the object’s new accessor, to which the
            // call is then forwarded.
            else if (
                Object.prototype.isPrototypeOf.call( owner, this ) &&
                !Z.hasOwn.call( this, name )
            ) {
                new StateController( this, null, {
                    name: name,
                    initialState: self.current().toString()
                });
                return this[ name ].apply( this, arguments );
            }
        }

        if ( Z.env.debug ) {
            accessor.toString = function () { return self.current().toString(); };
        }

        return accessor;
    }

    // <a class="icon-link"
    //    name="state-controller--private--virtualize"
    //    href="#state-controller--private--virtualize"></a>
    // 
    // #### virtualize
    // 
    // Creates a transient virtual state within the local state hierarchy to represent
    // `protostate`, along with as many virtual superstates as are necessary to reach a real
    // [`State`](#state) in the local hierarchy.
    function virtualize ( protostate ) {
        var derivation, state, next, name;
        function iterate () {
            return next = state.substate( ( name = derivation.shift() ), false );
        }
        if ( protostate instanceof State &&
            protostate.owner().isPrototypeOf( this.owner() ) &&
            ( derivation = protostate.derivation( true ) ).length
        ) {
            for ( state = this.root(), iterate(); next; state = next, iterate() );
            while ( name ) {
                state = new State( state, name, { attributes: STATE_ATTRIBUTES.VIRTUAL } );
                name = derivation.shift();
            }
            return state;
        }
    }

    // <a class="icon-link"
    //    name="state-controller--private--evaluate-guard"
    //    href="#state-controller--private--evaluate-guard"></a>
    // 
    // #### evaluateGuard
    // 
    // Returns the `Boolean` result of the guard function at `guardName` defined on this state,
    // as evaluated against `testState`, or `true` if no guard exists.
    function evaluateGuard ( guard, against ) {
        var key, value, valueIsFn, args, selectors, i, l,
            result = true;

        typeof guard === 'string' && ( guard = this.guard( guard ) );

        if ( !guard ) return true;

        for ( key in guard ) if ( Z.hasOwn.call( guard, key ) ) {
            value = guard[ key ], valueIsFn = typeof value === 'function';
            valueIsFn && ( args || ( args = Z.slice.call( arguments, 1 ) ) );
            selectors = Z.trim( key ).split( /\s*,+\s*/ );
            for ( i = 0, l = selectors.length; i < l; i++ ) {
                if ( this.query( selectors[i], against ) ) {
                    result = !!( valueIsFn ? value.apply( this, args ) : value );
                    break;
                }
            }
            if ( !result ) break;
        }
        return result;
    }

    // <a class="icon-link"
    //    name="state-controller--privileged"
    //    href="#state-controller--privileged"></a>
    // 
    // ### External privileged methods
    StateController.privileged = {

        // <a class="icon-link"
        //    name="state-controller--privileged--change"
        //    href="#state-controller--privileged--change"></a>
        // 
        // #### change
        // 
        // Attempts to execute a state transition. Handles asynchronous transitions, generation of
        // appropriate events, and construction of any necessary temporary virtual states. Respects
        // guards supplied in both the origin and `target` states. Fails by returning `false` if
        // the transition is disallowed.
        // 
        // The `target` parameter may be either a [`State`](#state) object that is part of this
        // controller’s state hierarchy, or a string that resolves to a likewise targetable `State`
        // when evaluated from the context of the most recently current state.
        // 
        // The `options` parameter is an optional map that may include:
        // 
        // * `arguments` : `Array` — arguments to be passed to a transition’s `action` function.
        // * `success` : `Function` — callback to be executed upon successful completion of the
        //   transition.
        // * `failure` : `Function` — callback to be executed if the transition attempt is blocked
        //   by a guard.
        change: function ( setCurrent, setTransition ) {
            var defaultOptions = {};

            return function (
                /*State | String*/ target,
                        /*Object*/ options // optional
            ) {
                var owner, transition, targetOwner, source, origin, domain, info, state, record,
                    transitionExpression,
                    self = this;

                owner = this.owner();
                transition = this.transition();

                // The `origin` is defined as the controller’s most recently current state that is
                // not a `Transition`.
                origin = transition ? transition.origin() : this.current();

                // Departures are not allowed from a state that is `final`.
                if ( origin.isFinal() ) return null;

                // Ensure that `target` is a valid [`State`](#state).
                if ( Z.isNumber( target ) ) {
                    // TODO: Interpret number-typed `target` as a history traversal. 
                }
                target instanceof State ||
                    ( target = target ? origin.query( target ) : this.root() );
                if ( !target ||
                        ( targetOwner = target.owner() ) !== owner &&
                        !targetOwner.isPrototypeOf( owner )
                ) {
                    return null;
                }

                // Resolve `options` to an object if necessary.
                !options && ( options = defaultOptions ) ||
                    Z.isArray( options ) && ( options = { arguments: options } );

                // An ingressing transition that targets a retained state must be redirected to
                // whichever of that state’s internal states was most recently current.
                if ( !options.direct && target.isRetained() && !target.isActive() ) {
                    record = this.history( 0 );
                    target = record && target.query( record.state ) || target;
                }

                // A transition cannot target an abstract state directly, so `target` must be
                // reassigned to the appropriate concrete substate.
                while ( target.isAbstract() ) {
                    target = target.defaultSubstate();
                    if ( !target ) return null;
                }

                // If any guards are in place for the given `origin` and `target` states, they must
                // consent to the transition.
                if ( !options.forced && (
                        !evaluateGuard.call( origin, 'release', target ) ||
                        !evaluateGuard.call( target, 'admit', origin )
                ) ) {
                    typeof options.failure === 'function' && options.failure.call( this );
                    return null;
                }

                // If `target` is a protostate, i.e. a state from a prototype of `owner`, then it
                // must be represented within `owner` as a transient virtual state that inherits
                // from the protostate.
                target && target.controller() !== this &&
                    ( target = virtualize.call( this, target ) );

                // The `source` variable will reference the previously current state (or abortive
                // transition).
                source = state = this.current();

                // The upcoming transition will start from its `source` and proceed within the
                // `domain` of the least common ancestor between that state and the specified
                // target.
                domain = source.common( target );

                // Conclusivity is enforced by checking each state that will be exited for the
                // `conclusive` attribute.
                for ( state = source; state !== domain; state = state.superstate() ) {
                    if ( state.isConclusive() ) return null;
                }

                // If a previously initiated transition is still underway, it needs to be
                // notified that it won’t finish.
                transition && transition.abort();

                // Retrieve the appropriate transition expression for this origin/target pairing;
                // if none is defined, then an actionless default transition will be created and
                // applied, causing the callback to return immediately.
                transitionExpression = this.getTransitionExpressionFor( target, origin );
                transition = setTransition( new Transition( target, source,
                    transitionExpression ));
                info = { transition: transition, forced: !!options.forced };

                // Preparation for the transition begins by emitting a `depart` event on the
                // `source` state.
                source.emit( 'depart', info, false );

                // Enter into the transition state.
                setCurrent( transition );
                transition.emit( 'enter', false );

                // Walk up to the top of the domain, emitting `exit` events for each state
                // along the way.
                for ( state = source; state !== domain; ) {
                    state.emit( 'exit', info, false );
                    transition.attachTo( state = state.superstate() );
                }

                // Provide an enclosed callback that will be called from `transition.end()` to
                // conclude the transition.
                transition.setCallback( function () {
                    var pathToState = [],
                        state, substate, superstate;

                    // Trace a path from `target` up to `domain`, then walk down it, emitting
                    // `enter` events for each state along the way.
                    for ( state = target; state !== domain; state = state.superstate() ) {
                        pathToState.push( state );
                    }
                    for ( state = domain; substate = pathToState.pop(); state = substate ) {
                        state.isShallow() && state.hasHistory() && state.push( substate );
                        transition.attachTo( substate );
                        substate.emit( 'enter', info, false );
                    }

                    // Exit from the transition state.
                    transition.emit( 'exit', false );
                    setCurrent( target );

                    // Terminate the transition with an `arrive` event on the targeted state.
                    target.emit( 'arrive', info, false );

                    // For each state from `target` to `root` that records a deep history, push a
                    // new element that points to `target`.
                    for ( state = target; state; state = superstate ) {
                        superstate = state.superstate();
                        state.isShallow() || state.hasHistory() && state.push( target );
                    }

                    // Any virtual states that were previously active are no longer needed.
                    for ( state = origin; state.isVirtual(); state = superstate ) {
                        superstate = state.superstate();
                        state.destroy();
                    }

                    // Now complete, the [`Transition`](#transition) instance can be discarded.
                    transition.destroy();
                    transition = setTransition( null );

                    typeof options.success === 'function' && options.success.call( this );

                    return target;
                });

                // At this point the transition is attached to the `domain` state and is ready
                // to proceed.
                return transition.start.apply( transition, options.arguments ) || target;
            }
        }
    };

    // <a class="icon-link"
    //    name="state-controller--prototype"
    //    href="#state-controller--prototype"></a>
    // 
    // ### Prototype methods
    Z.assign( StateController.prototype, {

        // <a class="icon-link"
        //    name="state-controller--prototype--to-string"
        //    href="#state-controller--prototype--to-string"></a>
        // 
        // #### toString
        // 
        toString: function () {
            return this.current().toString();
        },

        // <a class="icon-link"
        //    name="state-controller--prototype--get-transition-expression-for"
        //    href="#state-controller--prototype--get-transition-expression-for"></a>
        // 
        // #### getTransitionExpressionFor
        // 
        // Finds the appropriate transition expression for the given origin and target states. If
        // no matching transitions are defined in any of the states, returns a generic actionless
        // transition expression for the origin/target pair.
        getTransitionExpressionFor: function ( target, origin ) {
            origin || ( origin = this.current() );

            function search ( state, until ) {
                var transitions, key, expr, guards, admit, release;
                for ( ; state && state !== until; state = until ? state.superstate() : null ) {
                    transitions = state.transitions();
                    for ( key in transitions ) if ( Z.hasOwn.call( transitions, key ) ) {
                        expr = transitions[ key ];
                        if (
                            ( !( guards = expr.guards ) ||
                                (
                                    !( admit = guards.admit ) ||
                                        Z.isEmpty( admit ) ||
                                        evaluateGuard.call( origin, admit, target, origin )
                                )
                                    &&
                                (
                                    !( release = guards.release ) ||
                                        Z.isEmpty( release ) ||
                                        evaluateGuard.call( target, release, origin, target )
                                )
                            )
                                &&
                            ( expr.target ? state.query( expr.target, target ) : state === target )
                                &&
                            ( !expr.origin || state.query( expr.origin, origin ) )
                        ) {
                            return expr;
                        }
                    }
                }
            }

            // Search order:
            // 1. `target`,
            // 2. `origin`,
            // 3. superstates of `target`,
            // 4. superstates of `origin`.
            return (
                search( target ) ||
                origin !== target && search( origin ) ||
                search( target.superstate(), this.root() ) || search( this.root() ) ||
                !target.isIn( origin ) && search( origin.superstate(), origin.common( target ) ) ||
                new TransitionExpression
            );
        }
    });

    return StateController;
})();