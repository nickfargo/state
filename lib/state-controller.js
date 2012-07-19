// <a class="icon-link"
//    name="state-controller"
//    href="#state-controller"></a>
// 
// ## StateController
// 
// A **state controller** maintains the identity of the owner’s **current
// state**, and facilitates transitions from one state to another. It provides
// the behavior-modeling aspect of the owner’s state by forwarding method calls
// made on the owner to any associated stateful implementations of those
// methods that are valid given the current state.
var StateController = ( function () {
    var defaultOptions = {};

    // <a class="icon-link"
    //    name="state-controller--constructor"
    //    href="#state-controller--constructor"></a>
    // 
    // ### Constructor
    function StateController (
                          /*Object*/ owner,           // = {}
                 /*StateController*/ supercontroller, // optional
        /*StateExpression | Object*/ expression,      // optional
                          /*Object*/ options          // optional
    ) {
        if ( !( this instanceof StateController ) ) {
            return new StateController( owner, supercontroller, expression,
                options );
        }

        var self = this,
            name, root, currentState, currentTransition, subcontrollers,
            d;

        // Validate arguments.
        owner || ( owner = {} );
        expression instanceof StateExpression ||
            ( expression = new StateExpression( expression ) );
        options === undefined && ( options = defaultOptions ) ||
            typeof options === 'string' &&
                ( options = { initialState: options } );

        // Assign to `owner` an
        // [accessor method](#state-controller--private--create-accessor)
        // that will serve as the owner’s interface into its state.
        name = options.name || 'state';
        owner[ name ] = createAccessor( owner, name, this );

        // <a class="icon-link"
        //    name="state-controller--constructor--owner"
        //    href="#state-controller--constructor--owner"></a>
        // 
        // #### owner
        // 
        // Returns the owner object on whose behalf this controller acts.
        this.owner = O.thunk( owner );

        // <a class="icon-link"
        //    name="state-controller--constructor--name"
        //    href="#state-controller--constructor--name"></a>
        // 
        // #### name
        // 
        // Returns the name assigned to this controller. This is also the key
        // in `owner` that holds the `accessor` function associated with this
        // controller.
        this.name = O.stringFunction( function () { return name; } );

        // <a class="icon-link"
        //    name="state-controller--constructor--current"
        //    href="#state-controller--constructor--current"></a>
        // 
        // #### current
        // 
        // Returns the controller’s current state, or currently active
        // transition.
        this.current = function () { return currentState; };
        this.current.toString = function () {
            if ( currentState ) return currentState.toString();
        };

        // <a class="icon-link"
        //    name="state-controller--constructor--transition"
        //    href="#state-controller--constructor--transition"></a>
        // 
        // #### transition
        // 
        // Returns the currently active transition, or `undefined` if the
        // controller is not presently engaged in a transition.
        this.transition = function () { return currentTransition; };
        this.transition.toString = function () {
            if ( currentTransition ) return currentTransition.toString();
        };

        // <a class="icon-link"
        //    name="state-controller--constructor--change"
        //    href="#state-controller--constructor--change"></a>
        // 
        // #### change
        // 
        // Attempts to execute a state transition. Handles asynchronous
        // transitions, generation of appropriate events, and construction of
        // any necessary temporary virtual states. Respects guards supplied in
        // both the origin and `target` states.
        // 
        // The `target` parameter may be either a [`State`](#state) object
        // within the purview of this controller, or a string that resolves to
        // a likewise targetable `State` when evaluated from the context of the
        // most recently current state.
        // 
        // The `options` parameter is an optional map that may include:
        // 
        // * `args` : `Array` — arguments to be passed to a transition’s
        //   `action` function.
        // 
        // * `success` : `Function` — callback to be executed upon successful
        //   completion of the transition.
        // 
        // * `failure` : `Function` — callback to be executed if the transition
        //   attempt is blocked by a guard.
        this.change = function (
            /*State | String*/ target,
                    /*Object*/ options // optional
        ) {
            var transition, origin, targetOwner, source, domain,
                state, record,
                self = this;

            transition = currentTransition;

            // The `origin` is defined as the controller’s most recently
            // current state that is not a `Transition`.
            origin = transition ? transition.origin() : currentState;

            // Departures are not allowed from a state that is `final`.
            if ( origin.isFinal() ) return null;

            // Ensure that `target` is a valid [`State`](#state).
            if ( !( target instanceof State ) ) {
                target = target ? origin.query( target ) : root;
            }
            if ( !target ||
                    ( targetOwner = target.owner() ) !== owner &&
                    !targetOwner.isPrototypeOf( owner )
            ) {
                return null;
            }

            // Resolve `options` to an object if necessary.
            if ( !options ) {
                options = defaultOptions;
            } else if ( O.isArray( options ) ) {
                options = { args: options };
            }

            // A transition cannot target an abstract state directly, so
            // `target` must be reassigned to the appropriate concrete
            // substate.
            while ( target.isAbstract() ) {
                target = target.defaultSubstate();
                if ( !target ) return null;
            }

            // If any guards are in place for the given `origin` and `target`
            // states, they must consent to the transition.
            if ( !options.forced && (
                    !evaluateGuard.call( origin, 'release', target ) ||
                    !evaluateGuard.call( target, 'admit', origin )
            ) ) {
                if ( typeof options.failure === 'function' ) {
                    options.failure.call( this );
                }
                return null;
            }

            // If `target` is a protostate, i.e. a state from a prototype of
            // `owner`, then it must be represented within `owner` as a
            // transient virtual state that inherits from the protostate.
            if ( target && target.controller() !== this ) {
                target = virtualize.call( this, target );
            }

            // The `source` variable will reference the previously current
            // state (or abortive transition).
            source = currentState;

            // The upcoming transition will start from its `source` and
            // proceed within the `domain` of the least common ancestor
            // between that state and the specified target.
            domain = source.common( target );

            // Conclusivity is enforced by checking each state that will be
            // exited against the `conclusive` attribute.
            state = source;
            while ( state !== domain ) {
                if ( state.isConclusive() ) return null;
                state = state.superstate();
            }

            // If a previously initiated transition is still underway, it
            // needs to be notified that it won’t finish.
            transition && transition.abort();

            // Create the appropriate transition for this origin/target
            // pairing. If none is defined, then create an actionless default
            // transition that will cause the callback to return immediately.
            transition = currentTransition = new Transition( target, source,
                this.getTransitionExpressionFor( target, origin ) );

            // Preparation for the transition begins by emitting a `depart`
            // event on the `source` state.
            source.emit( 'depart', transition, false );
            transition.wasAborted() && ( transition = null );

            // Enter into the transition state.
            if ( transition ) {
                currentState = transition;
                transition.emit( 'enter', false );
                transition.wasAborted() && ( transition = null );
            }

            // Walk up to the top of the domain, emitting `exit` events for
            // each state along the way.
            for ( state = source; transition && state !== domain; ) {
                state.emit( 'exit', transition, false );
                transition.attachTo( state = state.superstate() );
                transition.wasAborted() && ( transition = null );
            }

            // A scoped callback will be invoked by `transition.end()` to
            // conclude the transition.
            transition && transition.setCallback( function () {
                var state, pathToState, substate, superstate;

                transition.wasAborted() && ( transition = null );

                // Trace a path from `target` up to `domain`, then walk down
                // it, emitting `enter` events for each state along the way.
                if ( transition ) {
                    for ( state = target, pathToState = [];
                          state !== domain;
                          state = state.superstate()
                    ) {
                        pathToState.push( state );
                    }
                }
                for ( state = domain;
                    transition && ( substate = pathToState.pop() );
                    state = substate
                ) {
                    transition.attachTo( substate );
                    substate.emit( 'enter', transition, false );
                    transition.wasAborted() && ( transition = null );
                }

                // Exit from the transition state.
                if ( transition ) {
                    transition.emit( 'exit', false );
                    transition.wasAborted() && ( transition = null );
                }

                // Terminate the transition with an `arrive` event on the
                // targeted state.
                if ( transition ) {
                    currentState = target;
                    target.emit( 'arrive', transition, false );

                    // Any virtual states that were previously active are no
                    // longer needed.
                    for ( state = origin;
                          state.isVirtual();
                          state = superstate
                    ) {
                        superstate = state.superstate();
                        state.destroy();
                    }

                    // Now complete, the [`Transition`](#transition) instance
                    // can be discarded.
                    transition.destroy();
                    transition = currentTransition = null;

                    if ( typeof options.success === 'function' ) {
                        options.success.call( this );
                    }

                    return target;
                }

                return null;
            });

            // At this point the transition is attached to the `domain` state
            // and is ready to proceed.
            return transition &&
                transition.start.apply( transition, options.args ) ||
                currentState;
        };

        // <a class="icon-link"
        //    name="state-controller--constructor--destroy"
        //    href="#state-controller--constructor--destroy"></a>
        // 
        // #### destroy
        // 
        // Destroys this controller and all of its states, and returns the
        // owner to its original condition.
        this.destroy = function () {
            var result;
            delete this.destroy;
            currentTransition && currentTransition.abort();
            root.destroy();
            result = delete owner[ name ];
            owner = self = root = currentState = currentTransition = null;
            return result;
        };

        // Instantiate the root state, adding a redefinition of the
        // `controller` method that points directly to this controller, along
        // with all of the members and substates outlined in `expression`.
        root = new State( this, '', expression );

        // Establish which state should be the initial state and set the
        // current state to that.
        currentState = root.initialSubstate() || root;
        if ( options.initialState !== undefined ) {
            currentState = root.query( options.initialState );
        }
        if ( currentState.isAbstract() ) {
            ( d = currentState.defaultSubstate() ) && ( currentState = d );
        }
        if ( currentState.controller() !== this ) {
            currentState = virtualize.call( this, currentState );
        }

        // (Exposed for debugging.)
        O.env.debug && ( this.__private__ = {
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
    // Returns an `accessor` function, which will serve as an owner object’s
    // interface to the implementation of its state.
    function createAccessor ( owner, name, self ) {
        function accessor ( input ) {
            var current, match, method;

            if ( this === owner ) {
                current = self.current();
                if ( arguments.length === 0 ) return current;
                if ( typeof input === 'function' ) {
                    return current.change( input.call( this ) );
                }
                if ( typeof input === 'string' &&
                    ( match = input.match( rxTransitionArrow ) ) &&
                    ( method = transitionArrowMethods[ match[1] ] )
                ) {
                    if ( arguments.length > 1 ) {
                        return current[ method ].apply( current, [ match[2] ]
                            .concat( O.slice.call( arguments, 1 ) ) );
                    } else return current[ method ]( match[2] );
                }
                return current.query.apply( current, arguments );
            }

            // Calling the accessor of a prototype means that `this` requires
            // its own accessor and [`StateController`](#state-controller).
            // Creating a new `StateController` has the desired side-effect of
            // also creating the object’s new accessor, to which the call is
            // then forwarded.
            else if (
                Object.prototype.isPrototypeOf.call( owner, this ) &&
                !O.hasOwn.call( this, name )
            ) {
                new StateController( this, null, null, {
                    name: name,
                    initialState: self.current().toString()
                });
                return this[ name ].apply( this, arguments );
            }
        }

        accessor.isAccessor = true;

        if ( O.env.debug ) {
            accessor.toString = function () {
                return "[accessor] -> " + self.current().toString();
            };
        }

        return accessor;
    }

    // <a class="icon-link"
    //    name="state-controller--private--virtualize"
    //    href="#state-controller--private--virtualize"></a>
    // 
    // #### virtualize
    // 
    // Creates a transient virtual state within the local state hierarchy to
    // represent `protostate`, along with as many virtual superstates as are
    // necessary to reach a real [`State`](#state) in the local hierarchy.
    function virtualize ( protostate ) {
        var derivation, state, next, name;
        function iterate () {
            next = state.substate( ( name = derivation.shift() ), false );
            return next;
        }
        if ( protostate instanceof State &&
            protostate.owner().isPrototypeOf( this.owner() ) &&
            ( derivation = protostate.derivation( true ) ).length
        ) {
            state = this.root();
            iterate();
            while ( next ) {
                state = next;
                iterate();
            }
            while ( name ) {
                state = new State( state, name, {
                    attributes: STATE_ATTRIBUTES.VIRTUAL
                });
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
    // Returns the `Boolean` result of the guard function at `guardName`
    // defined on this state, as evaluated against `testState`, or `true` if no
    // guard exists.
    function evaluateGuard ( guard, against ) {
        var key, value, valueIsFn, args, selectors, i, l,
            result = true;

        typeof guard === 'string' && ( guard = this.guard( guard ) );

        if ( !guard ) return true;

        for ( key in guard ) if ( O.hasOwn.call( guard, key ) ) {
            value = guard[ key ];
            valueIsFn = typeof value === 'function';

            valueIsFn && ( args || ( args = O.slice.call( arguments, 1 ) ) );
            selectors = O.trim( key ).split( /\s*,+\s*/ );
            for ( i = 0, l = selectors.length; i < l; i++ ) {
                if ( this.query( selectors[i], against ) ) {
                    result = valueIsFn ? !!value.apply( this, args ) : !!value;
                    break;
                }
            }
            if ( !result ) break;
        }
        return result;
    }

    // <a class="icon-link"
    //    name="state-controller--prototype"
    //    href="#state-controller--prototype"></a>
    // 
    // ### Prototype methods
    O.assign( StateController.prototype, {

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
        // Finds the appropriate transition expression for the given origin and
        // target states. If no matching transitions are defined in any of the
        // states, returns a generic actionless transition expression for the
        // origin/target pair.
        getTransitionExpressionFor: function ( target, origin ) {
            origin || ( origin = this.current() );

            function search ( state, until ) {
                var transitions, key, expr, guards, admit, release;
                for ( ;
                     state && state !== until;
                     state = until ? state.superstate() : null
                ) {
                    transitions = state.transitions();
                    for ( key in transitions ) {
                        if ( O.hasOwn.call( transitions, key ) ) {
                            expr = transitions[ key ];
                            if (
                                ( !( guards = expr.guards ) ||
                                    (
                                        !( admit = guards.admit ) ||
                                            O.isEmpty( admit ) ||
                                            evaluateGuard.call( origin, admit,
                                                target, origin )
                                    )
                                        &&
                                    (
                                        !( release = guards.release ) ||
                                            O.isEmpty( release ) ||
                                            evaluateGuard.call( target,
                                                release, origin, target )
                                    )
                                )
                                    &&
                                ( expr.target ?
                                        state.query( expr.target, target ) :
                                        state === target
                                )
                                    &&
                                ( !expr.origin ||
                                    state.query( expr.origin, origin )
                                )
                            ) {
                                return expr;
                            }
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
                search( target )
                    ||
                origin !== target && search( origin )
                    ||
                search( target.superstate(), this.root() ) ||
                        search( this.root() )
                    ||
                !target.isIn( origin ) &&
                        search( origin.superstate(), origin.common( target ) )
                    ||
                new TransitionExpression
            );
        }
    });

    return StateController;
}() );