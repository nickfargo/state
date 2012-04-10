// Copyright (C) 2011-2012
// Nick Fargo, Z Vector Inc.
// 
// License MIT; see file [`LICENSE`](https://github.com/nickfargo/state/blob/master/LICENSE)
// for details.
// 
// [statejs.org](http://statejs.org/)
// [github](http://github.com/nickfargo/state/)

( function ( undefined ) {

"use strict";

var global = this,

    meta = {
        VERSION: '0.0.3',

        noConflict: ( function () {
            var original = global.state;
            return function () {
                global.state = original;
                return this;
            };
        })()
    },

    // The lone dependency of the **State** module is
    // [**Zcore**](http://github.com/zvector/zcore), a library that assists with tasks such as
    // object manipulation, differential operations, facilitating prototypal inheritance, etc.
    Z = typeof require !== 'undefined' ? require('zcore') : global.Z;


// <a id="module" />

// ## state( ... )
// 
// The `state` module is exported as a function. This is used either: (1) to generate a formal
// `StateExpression`; or (2) to bestow an arbitrary `owner` object with a new implementation of
// state based on the supplied `expression`, returning the owner’s initial `State`.
// 
// All arguments are optional. If both an `owner` and `expression` are provided, `state` acts in
// the second capacity, causing `owner` to become stateful; otherwise, `state` simply returns a
// `StateExpression`. The `attributes` parameter may include any of the words defined in
// `STATE_ATTRIBUTE_MODIFIERS`; these are applied to the provided `expression`, and will be used
// to further specify the expressed state’s functionality, or to impose constraints on how that
// state may be used by its owner. (See `STATE_ATTRIBUTES` object below.)
// 
// *See also:* [`State`](#state), [`StateExpression`](#state-expression),
// [`StateController`](#state-controller)
function state (
                      /*Object*/ owner,      // optional
                      /*String*/ attributes, // optional
    /*StateExpression | Object*/ expression, // optional
             /*Object | String*/ options     // optional
) {
    if ( arguments.length < 2 ) {
        typeof owner === 'string' ? ( attributes = owner ) : ( expression = owner );
        owner = undefined;
    } else {
        typeof owner === 'string' &&
            ( options = expression, expression = attributes, attributes = owner,
                owner = undefined );
        typeof attributes === 'string' ||
            ( options = expression, expression = attributes, attributes = undefined );
    }
    expression = new StateExpression( attributes, expression );
    return owner ? new StateController( owner, expression, options ).current() : expression;
}

Z.assign( state, meta );


// ### Module-level constants

// #### State attributes
// 
// These values are stored as a bit field in a `State` instance.
var STATE_ATTRIBUTES = {
        NORMAL      : 0x0,

        // A **virtual state** is a lightweight inheritor of a **protostate** located higher in the
        // owner object’s prototype chain.
        VIRTUAL     : 0x1,

        // Marking a state `initial` specifies which state a newly instantiated `StateController`
        // should assume.
        INITIAL     : 0x2,

        // Once a state marked `conclusive` is entered, it cannot be exited, although transitions
        // may still freely traverse within its substates.
        CONCLUSIVE  : 0x4,

        // Once a state marked `final` is entered, no further outbound transitions within its local
        // region are allowed.
        FINAL       : 0x8,

        // An **abstract state** cannot itself be current. Consequently a transition target that
        // points to a state marked `abstract` is redirected to one of its substates.
        ABSTRACT    : 0x10,

        // Marking a state `default` designates it as the actual target for any transition that
        // targets its abstract superstate.
        DEFAULT     : 0x20,

        // A state marked `sealed` cannot have substates.
        SEALED      : 0x40,

        // A `retained` state is one that preserves its own internal state, such that, after the
        // state has become no longer active, a subsequent transition targeting that particular
        // state will automatically be redirected to whichever of its descendant states was most
        // recently current.
        // *(Reserved; not presently implemented.)*
        RETAINED    : 0x80,

        // Marking a state with the `history` attribute causes its internal state to be recorded
        // in a sequential **history**. Whereas a `retained` state is concerned only with the most
        // recent internal state, a state’s history can be traversed and altered, resulting in
        // transitions back or forward to previously or subsequently held internal states.
        // *(Reserved; not presently implemented.)*
        HISTORY     : 0x100,

        // Normally, states that are `retained` or that keep a `history` persist their internal
        // state *deeply*, i.e., with a scope extending over all of the state’s descendant states.
        // Marking a state `shallow` limits the scope of its persistence to its immediate
        // substates only.
        // *(Reserved; not presently implemented.)*
        SHALLOW     : 0x200,

        // Causes alterations to a state to result in a reflexive transition, with a delta object
        // distinguishing the prior version of the state from its new version. Should also add a
        // history entry wherever appropriate, representing the prior version and the delta.
        // *(Reserved; not presently implemented.)*
        VERSIONED   : 0x400,

        // In a state marked `concurrent`, the substates are considered **concurrent orthogonal
        // regions**. Upon entering a concurrent state, the controller creates a new set of
        // subcontrollers, one for each region, which will exist as long as the concurrent state
        // remains active. Method calls are forwarded to at most one of the regions, or if a
        // reduction function is associated with the given method, the call is repeated for each
        // region and the results reduced accordingly on their way back to the owner.
        // *(Reserved; not presently implemented.)*
        CONCURRENT  : 0x800
    },

    // The subset of attributes that are valid keywords for the `attributes` argument in a call to
    // the exported `state` function.
    STATE_ATTRIBUTE_MODIFIERS = [
        'initial conclusive final',
        'abstract default sealed',
        'retained history shallow versioned',
        'concurrent'
    ].join(' '),
    
    // 
    STATE_EXPRESSION_CATEGORIES =
        'data methods events guards states transitions',
    
    // 
    STATE_EVENT_TYPES =
        'construct depart exit enter arrive destroy mutate',
    
    // 
    GUARD_ACTIONS =
        'admit release',
    
    // 
    TRANSITION_PROPERTIES =
        'origin source target action conjugate',
    
    // 
    TRANSITION_EXPRESSION_CATEGORIES =
        'methods events guards',
    
    // 
    TRANSITION_EVENT_TYPES =
        'construct destroy enter exit start end abort';

// 
Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

// <a id="state" />

// ## State
// 
// A **state** models a set of behaviors for an owner object. The owner may undergo **transitions**
// that change its **current** state from one to another, and in so doing adopt a different set of
// behaviors.
// 
// Distinct behaviors are modeled in each state by defining a set of method overrides, to which
// calls made on the owner will be redirected so long as a state remains current.
// 
// States are nested hierarchically in a tree structure, with **substates** that inherit from their 
// **superstate**. While a substate is current, both it and the transitive closure of its
// superstates (i.e., its “ancestor superstates”) are considered to be **active**.
// 
// In addition, a state also recognizes the owner object’s prototypal inheritance, identifying an
// identically named and positioned state in the prototype as its **protostate**. Behavior is
// always inherited *from protostates first*, then from superstates.

var State = ( function () {
    var SA = STATE_ATTRIBUTES;

    Z.assign( State, SA );

    // ### Constructor
    function State ( superstate, name, expression ) {
        if ( !( this instanceof State ) ) {
            return new State( superstate, name, expression );
        }
        
        var attributes = expression && expression.attributes || SA.NORMAL;
        
        // #### attributes
        // 
        // Returns the bit field of this state’s attributes.
        this.attributes = function () { return attributes; };

        // #### name
        // 
        // Returns the local name of this state.
        this.name = Z.stringFunction( function () { return name || ''; } );

        // Do the minimal setup required for a virtual state.
        if ( attributes & SA.VIRTUAL ) {
            this.superstate = State.privileged.superstate( superstate );

            // #### realize
            // 
            // Virtual states are weakly bound to a state hierarchy by their reference held at
            // `superstate`; they are not proper members of the superstate’s set of substates. The
            // `realize` method allows a virtual state to transform itself at some later time into
            // a “real” state, with its own set of closed properties and methods, existing
            // thereafter as an abiding member of its superstate’s set of substates.
            this.realize = function ( expression ) {
                delete this.realize;
                attributes &= ~SA.VIRTUAL;

                superstate.addSubstate( name, this ) &&
                    realize.call( this, superstate, attributes, expression );
                
                return this;
            };
        }

        // Do the full setup required for a real state.
        else {
            realize.call( this, superstate, attributes, expression );
        }
    }

    // ### Class-private functions

    // #### realize
    // 
    // Much of the initialization for `State` is offloaded from the constructor, allowing for
    // creation of lightweight virtual `State` instances that inherit all of their functionality
    // from protostates, but can also be converted later to a real `State` if necessary.
    function realize ( superstate, attributes, expression ) {
        var data = {},
            methods = {},
            events = {},
            guards = {},
            substates = {},
            transitions = {},
            history = attributes & SA.HISTORY || attributes & SA.RETAINED ? [] : null;
        
        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this.__private__ = {}, {
            attributes: attributes,
            data: data,
            methods: methods,
            events: events,
            guards: guards,
            substates: substates,
            transitions: transitions
        });
        
        function setSuperstate ( value ) { return superstate = value; }
        
        // Method names are mapped to specific local variables. The named methods are created on
        // `this`, each of which is a partial application of its corresponding method factory at
        // `State.privileged`.
        Z.privilege( this, State.privileged, {
            'init' : [ StateExpression ],
            'superstate' : [ superstate ],
            'data' : [ data ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ],
            'substate substates addSubstate removeSubstate' : [ substates ],
            'transition transitions addTransition' : [ transitions ],
            'destroy' : [ setSuperstate, methods, events, substates ]
        });
        history && Z.privilege( this, State.privileged, {
            'history push replace' : [ history ]
        });
        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );

        // If no superstate is given, e.g. for a root state being created by a `StateController`,
        // then `init()` must be called later by the implementor.
        superstate && this.init( expression );

        return this;
    }

    // #### createRealizer
    // 
    // Creates a method that will first realize the state and then, under the assumption that
    // realization has produced a new method of the same name on the instance, invoke the method.
    function createRealizer ( obj, names ) {
        Z.forEach( Z.trim( names ).split( Z.regexp.whitespace ), function ( name ) {
            obj[ name ] = function () { return this.realize()[ name ].apply( this, arguments ); };
        });
    }

    // #### createDelegator
    // 
    // Creates a function that will serve as a **delegator** method on an owner object. For each
    // method defined in any of the owner’s states, a delegator must be created and assigned on
    // the owner itself, at the `methodName` key. This delegator then forwards any calls to
    // `methodName` to the owner’s current state, which will locate the appropriate implementation
    // for the method, apply it, and return the result.
    // 
    // If an owner already has an implementation for a delegated method, it is copied into the
    // owner’s root state, such that it remains accessible as the owner’s “default behavior” if
    // none of its active states contains an implementation for that method.
    // 
    // Stateful methods are applied in the context of the `State` to which they belong, or, if a
    // method is inherited from a protostate, the context will be the corresponding virtual state
    // within the local `StateController`. However, for any a priori methods relocated to the root
    // state, the context appropriately remains bound to the owner object.
    // 
    // *See also:* `State.privileged.addMethod`
    function createDelegator ( accessorKey, methodName, original ) {
        function delegator () {
            return this[ accessorKey ]().apply( methodName, arguments );
        }
        
        delegator.isDelegator = true;
        original && ( delegator.original = original );

        return delegator;
    }

    // ### Privileged methods
    // 
    // Methods defined here are partially applied from within a constructor.
    State.privileged = {

        // #### init
        // 
        // Builds out the state’s members based on the expression provided.
        init: function ( /*Function*/ expressionConstructor ) {
            return function ( /*<expressionConstructor> | Object*/ expression ) {
                var map, category,
                    self = this;
                
                expression instanceof expressionConstructor ||
                    ( expression = expressionConstructor( expression ) );
                
                map = {
                    methods: function ( methodName, fn ) {
                        self.addMethod( methodName, fn );
                    },
                    events: function ( eventType, fn ) {
                        var i, l;
                        Z.isArray( fn ) || ( fn = [ fn ] );
                        for ( i = 0, l = fn.length; i < l; i++ ) {
                            self.addEvent( eventType, fn[i] );
                        }
                    },
                    guards: function ( guardType, guard ) {
                        self.addGuard( guardType, guard );
                    },
                    states: function ( stateName, stateExpression ) {
                        self.addSubstate( stateName, stateExpression );
                    },
                    transitions: function ( transitionName, transitionExpression ) {
                        self.addTransition( transitionName, transitionExpression );
                    }
                };

                this.atomic = true;

                expression.data && this.data( expression.data );
                Z.forEach( map, function ( fn, category ) {
                    expression[ category ] && Z.each( expression[ category ], fn );
                });
        
                delete this.atomic;

                this.emit( 'construct', { expression: expression }, false );
        
                return this;
            };
        },

        // #### superstate
        // 
        // Returns the immediate superstate, or the nearest state in the superstate chain with
        // the provided `stateName`.
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
        },

        // #### data
        // 
        // Either retrieves or edits a block of data associated with this state.
        // 
        // `data( [Boolean viaSuper], [Boolean viaProto] )`
        // 
        // Retrieves data attached to this state, including all data from inherited states, unless
        // specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
        // 
        // `data( Object edit )`
        // 
        // Edits data on this state. For keys in `edit` whose values are set to the `NIL`
        // directive, the matching keys in `data` are deleted. If the operation results in a change
        // to `data`, a `mutate` event is emitted for this state.
        data: function ( /*Object*/ data ) {
            return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
                var edit, delta, state, superstate, protostate;

                if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                    edit = viaSuper, viaSuper = viaProto = false;
                } else {
                    viaSuper === undefined && ( viaSuper = true );
                    viaProto === undefined && ( viaProto = true );
                }

                if ( edit && !Z.isEmpty( edit ) ) {
                    if ( this.isVirtual() ) return this.realize().data( edit );

                    delta = Z.delta( data, edit );
                    if ( !this.atomic && delta && !Z.isEmpty( delta ) ) {
                        this.push( 'delta', this, null, delta );
                        this.emit( 'mutate', [ edit, delta ], false );
                    }
                }
                else {
                    return Z.clone(
                        viaSuper && ( superstate = this.superstate() ) &&
                            superstate.data(),
                        viaProto && ( protostate = this.protostate() ) &&
                            protostate.data( false ),
                        data
                    );
                }

                return this;
            }
        },

        // #### method
        // 
        // Retrieves the named method held on this state. If no method is found, step through
        // this state’s protostate chain to find one. If no method is found there, step up the
        // superstate hierarchy and repeat the search.
        method: function ( methods ) {
            return function (
                 /*String*/ methodName,
                /*Boolean*/ viaSuper,    // = true
                /*Boolean*/ viaProto,    // = true
                 /*Object*/ out          // optional
            ) {
                var superstate, protostate, method;

                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );
                
                methods && ( method = methods[ methodName ] );
                
                if ( method && method !== Z.noop ) {
                    out && ( out.context = this, out.method = method );
                    return method;
                }
                
                if ( viaProto ) {
                    protostate = this.protostate();
                    if ( protostate ) {
                        method = protostate.method( methodName, false, true, out );
                        if ( method ) {
                            out && ( out.context = this );
                            return method;
                        }
                    }
                }

                if ( viaSuper ) {
                    superstate = this.superstate();
                    if ( superstate ) {
                        method = superstate.method( methodName, true, viaProto, out );
                        if ( method ) return method;
                    }
                }

                out && ( out.context = null, out.method = method );
                return method;
            };
        },

        // #### methodNames
        // 
        // Returns an `Array` of names of methods defined for this state.
        methodNames: function ( methods ) {
            return function () {
                return Z.keys( methods );
            };
        },

        // #### addMethod
        // 
        // Adds a method to this state, which will be callable directly from the owner, but with
        // its context bound to the state.
        addMethod: function ( methods ) {
            return function ( /*String*/ methodName, /*Function*/ fn ) {
                var controller = this.controller(),
                    controllerName = controller.name(),
                    root = controller.root(),
                    owner = controller.owner(),
                    ownerMethod;

                // If there is not already a method called `methodName` in the state hierarchy,
                // then the owner and controller need to be set up properly to accommodate calls
                // to this method.
                if ( !this.method( methodName, true, false ) ) {
                    if ( this !== root && !root.method( methodName, false, false ) ) {
                        ownerMethod = owner[ methodName ];
                        if ( ownerMethod === undefined || ownerMethod.isDelegator ) {
                            ownerMethod = Z.noop;
                        }
                        root.addMethod( methodName, ownerMethod );
                    }

                    // A delegator function is instated on the owner, which will direct subsequent
                    // calls to `owner[ methodName ]` to the controller, and then on to the
                    // appropriate state’s implementation.
                    owner[ methodName ] =
                        createDelegator( controllerName, methodName, ownerMethod );
                }

                return methods[ methodName ] = fn;
            };
        },

        // #### removeMethod
        // 
        // Dissociates the named method from this state object and returns its function.
        removeMethod: function ( methods ) {
            return function ( /*String*/ methodName ) {
                var fn = methods[ methodName ];
                delete methods[ methodName ];
                return fn;
            };
        },

        // #### event
        // 
        // Gets a registered event handler.
        event: function ( events ) {
            return function ( /*String*/ eventType, /*String*/ id ) {
                return events[ eventType ].get( id );
            };
        },

        // #### addEvent
        // 
        // Binds an event handler to the specified `eventType` and returns a unique identifier
        // for the handler. Recognized event types are listed at `StateEvent.types`.
        // 
        // *Aliases:* **on**, **bind**
        addEvent: function ( events ) {
            return function (
                  /*String*/ eventType,
                /*Function*/ fn,
                  /*Object*/ context    // = this
            ) {
                Z.hasOwn.call( events, eventType ) ||
                    ( events[ eventType ] = new StateEventCollection( this, eventType ) );
                
                return events[ eventType ].add( fn, context );
            };
        },

        // #### removeEvent
        // 
        // Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
        // 
        // *Aliases:* **off**, **unbind**
        removeEvent: function ( events ) {
            return function ( /*String*/ eventType, /*String*/ id ) {
                return events[ eventType ].remove( id );
            };
        },

        // #### emit
        // 
        // Invokes all bound handlers for the given event type.
        // 
        // *Alias:* **trigger**
        emit: function ( events ) {
            return function (
                 /*String*/ eventType,
                  /*Array*/ args,      // = []
                  /*State*/ context,   // = this
                /*Boolean*/ viaSuper,  // = true
                /*Boolean*/ viaProto   // = true
            ) {
                var e, protostate, superstate;

                if ( typeof eventType !== 'string' ) return;

                typeof args === 'boolean' &&
                    ( viaProto = viaSuper, viaSuper = context, context = args, args = undefined );
                typeof context === 'boolean' &&
                    ( viaProto = viaSuper, viaSuper = context, context = undefined );

                !args && ( args = [] ) || Z.isArray( args ) || ( args = [ args ] );
                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );

                ( e = events[ eventType ] ) && e.emit( args, context || this );

                viaProto && ( protostate = this.protostate() ) &&
                    protostate.emit( eventType, args, context || this, false );

                viaSuper && ( superstate = this.superstate() ) &&
                    superstate.emit( eventType, args, context || superstate );
            };
        },

        // #### guard
        // 
        // Gets a **guard** entity for this state. A guard is a value or function that will be
        // evaluated, as either a boolean or predicate, respectively, to provide a determination
        // of whether a controller will be admitted into or released from the state to which the
        // guard is applied. Guards are inherited from protostates, but not from superstates.
        // 
        // *See also:* `State.prototype.evaluateGuard`
        guard: function ( guards ) {
            return function ( /*String*/ guardType ) {
                var protostate;

                return (
                    guards[ guardType ]
                        ||
                    ( protostate = this.protostate() ) && protostate.guard( guardType )
                        ||
                    undefined
                );
            };
        },

        // #### addGuard
        // 
        // Adds a guard to the state.
        addGuard: function ( guards ) {
            return function ( /*String*/ guardType, guard ) {
                return guards[ guardType ] = guard;
            };
        },

        // #### removeGuard
        // 
        // Removes a guard. *(Not presently implemented.)*
        removeGuard: function ( guards ) {
            return function ( /*String*/ guardType, /*String*/ guardKey ) {
                throw new Error( "Not implemented" );
            };
        },

        // #### substate
        // 
        // Retrieves the named substate of `this` state. If no such substate exists in the local
        // state, any identically named substate held on a protostate will be returned.
        substate: function ( substates ) {
            return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
                var s = this.current(),
                    ss, protostate;
                
                viaProto === undefined && ( viaProto = true );

                // First scan for any virtual substates that are current on the local controller.
                for ( ; s && s.isVirtual() && ( ss = s.superstate() ); s = ss ) {
                    if ( ss === this && s.name() === stateName ) return s; 
                }

                // Otherwise retrieve a real substate, either locally or from a protostate.
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

        // #### substates
        // 
        // Returns an `Array` of this state’s substates.
        substates: function ( substates ) {
            return function ( /*Boolean*/ deep ) {
                var result = [],
                    key;
                
                for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
                    result.push( substates[ key ] );
                    deep && ( result = result.concat( substates[ key ].substates( true ) ) );
                }

                return result;
            };
        },

        // #### addSubstate
        // 
        // Creates a state from the supplied `stateExpression` and adds it as a substate of
        // this state. If a substate with the same `stateName` already exists, it is first
        // destroyed and then replaced. If the new substate is being added to the controller’s
        // root state, a reference is added directly on the controller itself as well.
        addSubstate: function ( substates ) {
            return function (
                /*String*/ stateName,
                /*StateExpression | Object | State*/ stateExpression
            ) {
                var substate, controller;
                
                if ( this.isVirtual() ) {
                    return this.realize().addSubstate( stateName, stateExpression );
                }
                if ( this.isSealed() ) return null;

                ( substate = substates[ stateName ] ) && substate.destroy();
                
                substate = stateExpression instanceof State ?
                    stateExpression.superstate() === this && stateExpression.realize() :
                    new State( this, stateName, stateExpression );
                
                if ( !substate ) return;
                
                this[ stateName ] = substates[ stateName ] = substate;
                
                controller = this.controller();
                controller.root() === this && ( controller[ stateName ] = substate );
                
                return substate;
            };
        },

        // #### removeSubstate
        // 
        // Removes the named substate from the local state, if possible.
        removeSubstate: function ( substates ) {
            return function ( /*String*/ stateName ) {
                var controller, current, transition,
                    substate = substates[ stateName ];

                if ( !substate ) return;

                controller = this.controller();
                current = controller.current();

                // If a transition is underway involving `substate`, the removal will fail.
                if (
                    ( transition = controller.transition() )
                        &&
                    (
                        substate.isSuperstateOf( transition ) ||
                        substate === transition.origin() ||
                        substate === transition.target()
                    )
                ) {
                    return false;
                }

                // The controller must be forced to evacuate the state before it is removed.
                current.isIn( substate ) && controller.change( this, { forced: true } );

                delete substates[ stateName ];
                delete this[ stateName ];
                controller.root() === this && delete controller[ stateName ];

                return substate;
            };
        },

        // #### transition
        // 
        // Returns the named transition expression held on this state.
        transition: function ( transitions ) {
            return function ( /*String*/ transitionName ) {
                return transitions[ transitionName ];
            };
        },

        // #### transitions
        // 
        // Returns an object containing all of the transition expressions defined on this state.
        transitions: function ( transitions ) {
            return function () {
                return Z.clone( transitions );
            };
        },

        // #### addTransition
        // 
        // Registers a transition expression to this state.
        addTransition: function ( transitions ) {
            return function (
                /*String*/ transitionName,
                /*TransitionExpression | Object*/ transitionExpression
            ) {
                transitionExpression instanceof TransitionExpression ||
                    ( transitionExpression = TransitionExpression( transitionExpression ) );
                
                return transitions[ transitionName ] = transitionExpression;
            };
        },

        // #### history
        // 
        history: function ( history ) {
            return function ( indexDelta ) {
                if ( indexDelta === undefined ) return Z.clone( history );
                return history[ history.index + indexDelta ];
            };
        },

        // #### push
        // 
        push: function ( history ) {
            return function ( flags, state, transition, data ) {
                var i, previous, current, superstate;

                typeof flags === 'string' ||
                    ( data = transition, transition = state, state = flags, flags = undefined );

                if ( !( state instanceof State && state.isIn( this ) ) ) return;

                flags = Z.assign( flags );

                i = history.index;
                previous = i === undefined ? null : history[i];

                i = history.index = i === undefined ? 0 : i + 1;
                current = history[i] = {
                    state: state.toString(),
                    transition: undefined,
                    data: undefined
                };

                if ( flags.relative ) {
                    if ( previous ) {
                        current.data = previous.data;
                        previous.data = Z.delta( current.data, data );
                    } else {
                        current.data = Z.clone( data );
                    }
                } else {
                    current.data = Z.clone( data );
                    previous && ( previous.data = Z.diff( previous.data, data ) );
                }

                history.splice( ++i, history.length - i );

                this.isActive() &&
                    ( superstate = this.superstate() ) &&
                    ( superstate = superstate.historian() ) &&
                    superstate.push( state, transition, flags, data );

                0 && this.goTo( state );

                return history.length;
            };
        },

        // #### replace
        // 
        replace: function ( history ) {
            return function ( flags, state, data ) {
                var previous, current, next, delta,
                    i = history.index,
                    l = history.length;

                if ( i === undefined ) {
                    this.push.apply( this, arguments );
                    return this;
                }

                typeof flags === 'string' || ( data = state, state = flags, flags = undefined );

                if ( !state.isIn( this ) ) return;

                flags = Z.assign( flags );

                current = history[i];
                i > 0 && ( previous = history[ i - 1 ] );
                i < l - 1 && ( next = history[ i + 1 ] );

                current.state = state.toString();
                delta = ( flags.relative ? Z.delta : Z.diff )( current.data, data );
                if ( !Z.isEmpty( delta ) ) {
                    previous && Z.extend( true, previous.data, delta );
                    next && Z.extend( true, next.data, delta );
                }
                current.data = Z.clone( data );

                0 && this.goTo( state );

                return this;
            };
        },

        // #### destroy
        // 
        // Attempts to cleanly destroy this state and all of its substates. A `destroy` event is
        // issued to each state after it is destroyed.
        destroy: function ( setSuperstate, methods, events, substates ) {
            return function () {
                var superstate = this.superstate(),
                    controller = this.controller(),
                    owner = controller.owner(),
                    transition = controller.transition(),
                    origin, target, key, methodName, delegator, method, stateName;
        
                // If a transition is underway that involves this state, then the state cannot be
                // destroyed.
                if ( transition ) {
                    origin = transition.origin(), target = transition.target();

                    if ( origin.isIn( this ) || target.isIn( this ) ) return false;
                }

                // Emit a `destroy` event on the local state.
                this.emit( 'destroy', false );
                for ( key in events ) {
                    events[ key ].destroy();
                    delete events[ key ];
                }

                if ( superstate ) {
                    superstate.removeSubstate( this.name() );
                }
                // This is the root state, so restore any original methods to the owner and
                // delete any delegators.
                else {
                    for ( methodName in methods ) {
                        delegator = owner[ methodName ];
                        method = delegator.original;
                        if ( method ) {
                            delete delegator.original;
                            owner[ methodName ] = method;
                        } else {
                            delete owner[ methodName ];
                        }
                    }
                }
                for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
                    substates[ stateName ].destroy();
                }
                setSuperstate( undefined );

                return true;
            };
        }
    };

    // ### Prototype methods
    // 
    // The instance methods defined above are also defined here, either as no-ops or defaults, so
    // as to provide virtual states with a conformant `State` interface despite not (or not yet)
    // having been realized.
    createRealizer( State.prototype, 'addMethod addEvent addGuard addSubstate addTransition' );
    Z.privilege( State.prototype, State.privileged, { 'data method substate' : [ null ] } );
    Z.assign( State.prototype, {
        attributes: Z.thunk( SA.NORMAL ),
        isVirtual:    function () { return !!( this.attributes() & SA.VIRTUAL ); },
        isInitial:    function () { return !!( this.attributes() & SA.INITIAL ); },
        isDefault:    function () { return !!( this.attributes() & SA.DEFAULT ); },
        isFinal:      function () { return !!( this.attributes() & SA.FINAL ); },
        isAbstract:   function () { return !!( this.attributes() & SA.ABSTRACT ); },
        isSealed:     function () { return !!( this.attributes() & SA.SEALED ); },
        isRetained:   function () { return !!( this.attributes() & SA.RETAINED ); },
        hasHistory:   function () { return !!( this.attributes() & SA.HISTORY ); },
        isShallow:    function () { return !!( this.attributes() & SA.SHALLOW ); },
        isVersioned:  function () { return !!( this.attributes() & SA.VERSIONED ); },
        isConcurrent: function () { return !!( this.attributes() & SA.CONCURRENT ); },

        'name \
         superstate \
         removeMethod \
         event removeEvent emit trigger \
         guard removeGuard \
         removeSubstate \
         transition removeTransition' :
            Z.noop,
        
        realize: Z.getThis,

        'methodNames substates': function () { return []; },
        transitions: function () { return {}; },
        destroy: Z.thunk( false ),


        // #### toString
        // 
        // Returns this state’s fully qualified name.
        toString: function () {
            return this.derivation( true ).join('.');
        },
        
        // #### controller
        // 
        // Gets the `StateController` to which this state belongs.
        controller: function () {
            var superstate = this.superstate();
            if ( superstate ) return superstate.controller();
        },
        
        // #### owner
        // 
        // Gets the owner object to which this state’s controller belongs.
        owner: function () {
            var controller = this.controller();
            if ( controller ) return controller.owner();
        },
        
        // #### root
        // 
        // Gets the root state, i.e. the top-level superstate of this state.
        root: function () {
            var controller = this.controller();
            if ( controller ) return controller.root();
        },
        
        // #### current
        // 
        // Gets the local controller’s current state.
        current: function () {
            var controller = this.controller();
            if ( controller ) return this.controller().current();
        },

        // #### defaultSubstate
        // 
        // Returns the first substate marked `default`, or simply the first substate.
        defaultSubstate: function () {
            var substates = this.substates(), i = 0, l = substates && substates.length;
            if ( !l ) return;
            for ( ; i < l; i++ ) if ( substates[i].isDefault() ) return substates[i];
            return substates[0];
        },

        // #### initialSubstate
        // 
        // Performs a “depth-within-breadth-first” recursive search to locate the most deeply
        // nested `initial` state by way of the greatest `initial` descendant state. Recursion
        // continues into the protostate only if no local descendant states are marked `initial`.
        initialSubstate: function (
            /*Boolean*/ viaProto // = true
        ) {
            var queue = [ this ],
                subject, substates, i, l, state, protostate;
            
            while ( subject = queue.shift() ) {
                substates = subject.substates();
                for ( i = 0, l = substates.length; i < l; i++ ) {
                    state = substates[i];
                    if ( state.isInitial() ) return state.initialSubstate( false ) || state;
                    queue.push( state );
                }
            }

            if ( ( viaProto || viaProto === undefined ) && ( protostate = this.protostate() ) ) {
                return protostate.initialSubstate( true );
            }
        },

        // #### protostate
        // 
        // Returns the **protostate**, the state analogous to `this` found in the next object in
        // the owner’s prototype chain that has one. A state inherits from both its protostate and
        // superstate, *in that order*.
        // 
        // If the owner does not share an analogous `StateController` with its prototype, or if no
        // protostate can be found in the hierarchy of the prototype’s state controller, then the
        // search is iterated up the prototype chain.
        // 
        // A state and its protostate will always share an identical name and identical derivation
        // pattern, as will the respective superstates of both, relative to one another.
        protostate: function () {
            var derivation = this.derivation( true ),
                controller = this.controller(),
                controllerName, owner, prototype, protostate, i, l, stateName;
            
            function iterate () {
                var fn, c;
                prototype = Z.getPrototypeOf( prototype );
                protostate = prototype &&
                    typeof prototype === 'object' &&
                    Z.isFunction( fn = prototype[ controllerName ] ) &&
                    ( c = fn.apply( prototype ) ) &&
                    c instanceof State ?
                        c.root() :
                        null;
            }
            
            if ( !controller ) return;

            controllerName = controller.name();
            prototype = owner = controller.owner();
        
            for ( iterate(); protostate; iterate() ) {
                for ( i = 0, l = derivation.length; i < l; i++ ) {
                    protostate = protostate.substate( derivation[i], false );
                    if ( !protostate ) return;
                }
                return protostate;
            }
        },

        // #### derivation
        // 
        // Returns an object array of this state’s superstate chain, starting after the root
        // state and ending at `this`. If `byName` is set to `true`, a string array of the
        // states’ names is returned instead.
        derivation: function ( /*Boolean*/ byName ) {
            for ( var result = [], state, superstate = this;
                    ( state = superstate ) && ( superstate = state.superstate() );
                    result.unshift( byName ? state.name() || '' : state ) );
            return result;
        },

        // #### depth
        // 
        // Returns the number of superstates this state has. The root state returns `0`, its
        // immediate substates return `1`, etc.
        depth: function () {
            for ( var count = 0, state = this, superstate;
                    superstate = state.superstate();
                    count++, state = superstate );
            return count;
        },

        // #### common
        // 
        // Returns the least common ancestor of `this` and `other`. If `this` is itself an ancestor
        // of `other`, or vice versa, that ancestor is returned.
        common: function ( /*State | String*/ other ) {
            var state;
            other instanceof State || ( other = this.query( other ) );
            for (
                this.depth() > other.depth() ?
                    ( state = other, other = this ) :
                    ( state = this );
                state;
                state = state.superstate() 
            ) {
                if ( state === other || state.isSuperstateOf( other ) ) return state;
            }
        },
        
        // #### is
        // 
        // Determines whether `this` is `state`.
        is: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this;
        },

        // #### isIn
        // 
        // Determines whether `this` is or is a substate of `state`.
        isIn: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this || state.isSuperstateOf( this );
        },
        
        // #### has
        // 
        // Determines whether `this` is or is a superstate of `state`.
        has: function ( /*State | String */ state ) {
            state instanceof State || ( state = this.query( state ) );
            return this === state || this.isSuperstateOf( state );
        },

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

        // #### isProtostateOf
        // 
        // Determines whether `this` is a state analogous to `state` on any object in the prototype
        // chain of `state`’s owner.
        isProtostateOf: function ( /*State | String*/ state ) {
            var protostate;
            state instanceof State || ( state = this.query( state ) );

            return ( protostate = state.protostate() ) ?
                this === protostate || this.isProtostateOf( protostate ) :
                false;
        },

        // #### apply
        // 
        // Finds a state method and applies it in the appropriate context. If the method was
        // originally defined in the owner, the context will be the owner. Otherwise, the context
        // will either be the state in which the method is defined, or if the implementation
        // resides in a protostate, the corresponding inheriting state in the local controller.
        apply: function ( /*String*/ methodName, /*Array*/ args ) {
            var out, method, context, owner, ownerMethod;

            out = { method: undefined, context: undefined };
            method = this.method( methodName, true, true, out );
            
            if ( !method ) throw new TypeError( "State '" + this + "' has no method '" +
                methodName + "'" );

            context = out.context;
            owner = this.owner();
            ownerMethod = owner[ methodName ];
            if ( ownerMethod && ownerMethod.original && context === this.root() ) {
                context = owner;
            }

            return method.apply( context, args );
        },
        
        // #### call
        // 
        // Variadic `apply`.
        call: function ( /*String*/ methodName ) {
            return this.apply( methodName, Z.slice.call( arguments, 1 ) );
        },
        
        // #### hasMethod
        // 
        // Determines whether `this` possesses or inherits a method named `methodName`.
        hasMethod: function ( /*String*/ methodName ) {
            var method = this.method( methodName );
            return method && method !== Z.noop;
        },
        
        // #### hasOwnMethod
        // 
        // Determines whether `this` directly possesses a method named `methodName`.
        hasOwnMethod: function ( /*String*/ methodName ) {
            return !!this.method( methodName, false, false );
        },

        // #### change
        // 
        // Forwards a `change` command to the state’s controller and returns its result.
        // 
        // *Aliases:* **be**, **become**, **go**, **goTo**
        'change be become go goTo': function () {
            var controller = this.controller();
            return controller.change.apply( controller, arguments );
        },
        
        // #### isCurrent
        // 
        // Returns a `Boolean` indicating whether `this` is the controller’s current state.
        isCurrent: function () {
            return this.current() === this;
        },
        
        // #### isActive
        // 
        // Returns a `Boolean` indicating whether `this` or one of its substates is the
        // controller’s current state.
        isActive: function () {
            var current = this.current();
            return current === this || this.isSuperstateOf( current );
        },
        
        // #### history
        // 
        history: function () {
            var h = this.historian();
            if ( h ) return h.history();
        },

        // #### historian
        // 
        // Returns the nearest history-keeping state.
        historian: function () {
            for ( var s = this; s; s = s.superstate() ) if ( s.hasHistory() ) return s;
        },

        push: function ( flags, state, transition, data ) {
            typeof flags === 'string' ||
                ( data = transition, transition = state, state = flags, flags = undefined );

            var historian = this.historian();

            if ( historian ) {
                // Before delegating to the historian, `state` must be resolved locally.
                state instanceof State || ( state = this.query( state ) );

                if ( state && state.isIn( this ) ) {
                    return historian.push( flags, state, transition, data );
                }
            }
        },

        replace: function ( flags, state, transition, data ) {
            var historian = this.historian();

            if ( historian ) {
                // Before delegating to the historian, `state` must be resolved locally.
                state instanceof State || ( state = this.query( state ) );

                if ( state && state.isIn( this ) ) {
                    return historian.push( flags, state, transition, data );
                }
            }
        },

        /** */
        pushHistory: global.history && global.history.pushState ?
            function ( title, urlBase ) {
                return global.history.pushState( this.data, title || this.toString(),
                    urlBase + '/' + this.derivation( true ).join('/') );
            } : Z.noop
        ,
        
        /** */
        replaceHistory: global.history && global.history.replaceState ?
            function ( title, urlBase ) {
                return global.history.replaceState( this.data, title || this.toString(),
                    urlBase + '/' + this.derivation( true ).join('/') );
            } : Z.noop
        ,

        // #### evaluateGuard
        // 
        // Returns the Boolean result of the guard function at `guardName` defined on this state,
        // as evaluated against `testState`, or `true` if no guard exists.
        evaluateGuard: function (
            /*String*/ guardName,
             /*State*/ testState   // optional
        ) {
            var state = this,
                guard = this.guard( guardName ),
                result;
            
            if ( !guard ) return true;

            Z.forEach( guard, function ( value, selector ) {
                Z.forEach( selector.split( /\s*,+\s*/ ), function ( expr ) {
                    if ( state.query( Z.trim( expr ), testState ) ) {
                        result = !!( typeof value === 'function' ?
                            value.call( state, testState ) :
                            value
                        );
                        return false; 
                    }
                });
                return result === undefined;
            });

            return result === undefined || result;
        },

        // #### query
        // 
        // Matches a string expression `expr` with the state or states it represents, evaluated
        // first in the context of `this`, then its substates, and then its superstates, until
        // all locations in the state tree have been searched for a match of `expr`.
        // 
        // Returns the matched `State`, or an `Array` containing the set of matched states. If a
        // state to be tested `against` is provided, a `Boolean` is returned, indicating whether
        // `against` is the matched state or is included in the matching set.
        // 
        // Setting `descend` to `false` disables recursion through the substates of `this`, and
        // likewise setting `ascend` to `false` disables the subsequent recursion through its
        // superstates.
        // 
        // *Aliases:* **$**, **match**
        'query $ match': function (
             /*String*/ expr,
              /*State*/ against, // optional
            /*Boolean*/ descend, // = true
            /*Boolean*/ ascend // = true
        ) {
            var parts, cursor, next, result, i, l, name,
                queue, subject, substates, state, superstate;
            
            if ( expr == null ) return false;
            if ( expr === '' ) return this.root();

            if ( typeof against === 'boolean' ) {
                ascend = descend, descend = against, against = undefined;
            }
            descend === undefined && ( descend = true );
            ascend === undefined && ( ascend = true );

            // An absolute wildcard expression is restricted to the root state.
            expr.search(/^\*+$/) === 0 && ( descend = false );

            // If `expr` is an absolute path, evaluate it from the root state as a relative path.
            if ( expr.charAt(0) !== '.' ) {
                return this.root().query( '.' + expr, against, descend, false );
            }

            // Split `expr` into tokens, parse, and return any matching state or set of states.
            ( parts = expr.split('.') ).shift();
            if ( !( l = parts.length ) ) return this;
            for ( i = 0, cursor = this; ; i++ ) {
                if ( i >= l ) return against ? against === cursor : cursor;
                
                name = parts[i];
                
                if ( name === '*' ) {
                    return against ? cursor === against.superstate() : cursor.substates();
                }
                if ( name === '**' ) {
                    return against ? cursor.isSuperstateOf( against ) : cursor.substates( true );
                }

                if ( name === '' && ( next = cursor.superstate() ) ) {
                    cursor = next;
                    continue;
                }

                if ( next = cursor.substate( name ) ) {
                    cursor = next;
                    continue;
                }

                break;
            }

            // If no match is found yet, then recursively descend with a breadth-first search.
            if ( descend ) {
                queue = [ this ];
                while ( subject = queue.shift() ) {
                    substates = subject.substates();
                    for ( i = 0, l = substates.length; i < l; i++ ) {
                        state = substates[i];

                        // The `ascend` block uses `descend` to indicate a substate that has
                        // already been searched.
                        if ( state === descend ) continue;

                        result = state.query( expr, against, false, false );
                        if ( result ) return result;

                        queue.push( state );
                    }
                }
            }

            // If a match still hasn’t been found, then recursively ascend, passing `this` as a
            // domain to be skipped during the superstate’s subsequent descent.
            if ( ascend && ( superstate = this.superstate() ) ) {
                result = superstate.query( expr, against, this, true );
                if ( result ) return result;
            }

            // No matches here.
            return against ? false : null;
        }
    });
    Z.alias( State.prototype, { addEvent: 'on bind', removeEvent: 'off unbind' } );

    return State;
})();


// <a id="state-expression" />

// ## StateExpression
// 
// A **state expression** formalizes a definition of a state’s contents. States are declared by
// calling the module’s exported `state()` function and passing it an object map containing the
// definition. This input may be expressed in a shorthand format, which the `StateExpression`
// constructor rewrites into unambiguous long form, which can be used later to create `State`
// instances.

var StateExpression = ( function () {
    var attributeMap   = Z.forEach( Z.assign( STATE_ATTRIBUTE_MODIFIERS ),
            function ( value, key, object ) { object[ key ] = key.toUpperCase(); }),
        categoryMap    = Z.assign( STATE_EXPRESSION_CATEGORIES ),
        eventTypes     = Z.assign( STATE_EVENT_TYPES ),
        guardActions   = Z.assign( GUARD_ACTIONS );

    // ### Constructor
    function StateExpression (
        /*String | Object*/ attributes, // optional
                 /*Object*/ map
    ) {
        if ( !( this instanceof StateExpression ) ) {
            return new StateExpression( attributes, map );
        }

        typeof attributes === 'string' ?
            map || ( map = {} ) :
            map || ( map = attributes, attributes = undefined );
        
        Z.extend( true, this, map instanceof StateExpression ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            Z.isNumber( attributes ) || ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // ### Static functions

    // #### encodeAttributes
    // 
    // Transforms the provided set of attributes into a bit field integer.
    function encodeAttributes ( /*Object | String*/ attributes ) {
        var key,
            result = STATE_ATTRIBUTES.NORMAL;

        typeof attributes === 'string' && ( attributes = Z.assign( attributes ) );

        for ( key in attributes ) {
            if ( Z.hasOwn.call( attributes, key ) && key in attributeMap ) {
                result |= STATE_ATTRIBUTES[ attributeMap[ key ] ];
            }
        }

        return result;
    }

    // #### interpret
    // 
    // Transforms a plain object map into a well-formed `StateExpression`, making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category,
            result = Z.assign( STATE_EXPRESSION_CATEGORIES, null );
        
        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            
            // **Priority 1:** Do a nominative type match for explicit expression instances.
            category =
                value instanceof StateExpression && 'states' ||
                value instanceof TransitionExpression && 'transitions';
            if ( category ) {
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }
            
            // **Priority 2:** Recognize an explicitly named category object.
            else if ( key in result ) {
                result[ key ] = Z.extend( result[ key ], value );
            }
            
            // **Priority 3:** Use keys and value types to infer implicit categorization.
            else {
                category =
                    key in eventTypes ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isPlainObject( value ) ? 'states' :
                    'methods';
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }
        }
        
        object = result.events;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( typeof value === 'function' || typeof value === 'string' ) {
                object[ key ] = [ value ];
            }
        }
        
        object = result.transitions;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof TransitionExpression ||
                ( object[ key ] = new TransitionExpression( value ) );
        }
        
        object = result.states;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof StateExpression ||
                ( object[ key ] = new StateExpression( value ) );
        }
        
        return result;
    }

    return StateExpression;
})();


// <a id="state-controller" />

// ## StateController
// 
// A state **controller** is the mediator between an owner object and its implementation of state.
// The controller maintains the identity of the owner’s active state, and facilitates transitions
// from one state to another. It provides the behavior-modeling aspect of the owner’s state by
// forwarding method calls made on the owner to any associated stateful implementations of those
// methods that are valid given the current state.

var StateController = ( function () {

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
            name, root, current, transition,
            defaultSubstate;
        
        function setCurrent ( value ) { return current = value; }
        function setTransition ( value ) { return transition = value; }
        
        // Validate arguments.
        owner || ( owner = {} );
        expression instanceof StateExpression ||
            ( expression = new StateExpression( expression ) );
        options === undefined && ( options = {} ) ||
            typeof options === 'string' && ( options = { initialState: options } );
        
        // Assign a function to the owner that will serve as its interface into its state.
        name = options.name || 'state';
        owner[ name ] = createAccessor( owner, name, this );
        
        // ### Internal privileged methods
        Z.assign( this, {
            // #### owner
            // 
            // Returns the owner object on whose behalf this controller acts.
            owner: function () { return owner; },

            // #### name
            // 
            // Returns the name assigned to this controller. This is also the key in `owner` that
            // holds the `accessor` function associated with this controller.
            name: Z.stringFunction( function () { return name; } ),

            // #### root
            // 
            // Returns the root state.
            root: function () { return root; },

            // #### current
            // 
            // Returns the controller’s current state, or currently active transition.
            current: Z.assign( function () { return current; }, {
                toString: function () { return current ? current.toString() : undefined; }
            }),

            // #### transition
            // 
            // Returns the currently active transition, or `undefined` if the controller is not
            // presently engaged in a transition.
            transition: Z.assign( function () { return transition; }, {
                toString: function () { return transition ? transition.toString() : ''; }
            }),

            // #### destroy
            // 
            // Destroys this controller and all of its states, and returns the owner to its original
            // condition.
            destroy: function () {
                var result;
                root.destroy();
                result = delete owner[ name ];
                owner = self = root = current = transition = defaultSubstate = null;
                return result;
            }
        });
        
        // Assign partially applied external privileged methods.
        Z.privilege( this, StateController.privileged, {
            'change' : [ setCurrent, setTransition ]
        });
        
        // Instantiate the root state, adding a redefinition of the `controller` method that points
        // directly to this controller, along with all of the members and substates outlined in
        // `expression`.
        root = new State( undefined, undefined, expression );
        root.controller = function () { return self; };
        root.init( expression );
        
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

    // ### Static functions

    // #### createAccessor
    // 
    // Returns an `accessor` function, which will serve as an owner object’s interface to the
    // implementation of its state.
    function createAccessor ( owner, name, self ) {
        function accessor () {
            var fn, current, controller, root, key, method;

            if ( this === owner ) {
                if ( Z.isFunction( fn = arguments[0] ) ) return self.change( fn.call( this ) );
                current = self.current();
                return arguments.length ? current.query.apply( current, arguments ) : current;
            }

            // Calling the accessor of a prototype means that `this` requires its own accessor
            // and `StateController`.
            else if (
                Object.prototype.isPrototypeOf.call( owner, this ) &&
                !Z.hasOwn( this, name )
            ) {
                controller = new StateController( this, null, {
                    name: name,
                    initialState: self.current().toString()
                });
                root = controller.root();

                // Any methods of `this` that have stateful implementations located higher in the
                // prototype chain must be copied into the root state to be used as defaults.
                for ( key in this ) if ( Z.hasOwn.call( this, key ) ) {
                    method = this[ key ];
                    if ( Z.isFunction( method ) && root.method( key, false ) ) {
                        root.addMethod( key, method );
                    }
                }

                return this[ name ].apply( this, arguments );
            }
        }
        return accessor;
    }

    // #### virtualize
    // 
    // Creates a transient virtual state within the local state hierarchy to represent
    // `protostate`, along with as many virtual superstates as are necessary to reach a real
    // `State` in the local hierarchy.
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
    
    // #### annihilate
    // 
    // Destroys the given `virtualState` and all of its virtual superstates.
    function annihilate ( virtualState ) {
        var superstate;
        while ( virtualState.isVirtual() ) {
            superstate = virtualState.superstate();
            virtualState.destroy();
            virtualState = superstate;
        }
    }
    
    // #### evaluateGuard
    // 
    // Returns the Boolean result of the guard function at `guardName` defined on this state,
    // as evaluated against `testState`, or `true` if no guard exists.
    function evaluateGuard ( guard, against ) {
        var key, value, valueIsFn, selectors, selector, expr,
            result = true;

        typeof guard === 'string' && ( guard = this.guard( guard ) );

        if ( !guard ) return true;

        for ( key in guard ) if ( Z.hasOwn.call( guard, key ) ) {
            selectors = key.split( /\s*,+\s*/ );
            value = guard[ key ], valueIsFn = typeof value === 'function';
            for ( selector in selectors ) if ( Z.hasOwn.call( selectors, selector ) ) {
                expr = selectors[ selector ];
                if ( this.query( Z.trim( expr ), against ) ) {
                    result = !!( valueIsFn ? value.call( this, against ) : value );
                    break;
                }
            }
            if ( !result ) break;
        }
        return result;
    }

    // ### External privileged methods

    StateController.privileged = {

        // #### change
        // 
        // Attempts to execute a state transition. Handles asynchronous transitions, generation of
        // appropriate events, and construction of any necessary temporary virtual states. Respects
        // guards supplied in both the origin and `target` states. Fails by returning `false` if
        // the transition is disallowed.
        // 
        // The `target` parameter may be either a `State` object that is part of this controller’s
        // state hierarchy, or a string that resolves to a likewise targetable `State` when
        // evaluated from the context of the most recently current state.
        // 
        // The `options` parameter is an optional map that may include:
        // 
        // * `forced` : `Boolean` — overrides any guards defined, ensuring the change will
        //   complete, assuming a valid target.
        // * `success` : `Function` — callback to be executed upon successful completion of the
        //   transition.
        // * `failure` : `Function` — callback to be executed if the transition attempt is blocked
        //   by a guard.
        change: function ( setCurrent, setTransition ) {
            var reentrant = true;

            function push () {
                reentrant = false;
                this.push.apply( this, arguments );
                reentrant = true;
            }

            return function (
                /*State | String*/ target,
                        /*Object*/ options // optional
            ) {
                if ( !reentrant ) return;

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

                // Resolve `target` argument to a proper `State` object if necessary.
                target instanceof State ||
                    ( target = target ? origin.query( target ) : this.root() );
            
                if ( !( target instanceof State ) ||
                        ( targetOwner = target.owner() ) !== owner &&
                        !targetOwner.isPrototypeOf( owner )
                ) {
                    return null;
                }

                // An ingressing transition that targets a retained state must be redirected to
                // whichever of that state’s internal states was most recently current.
                if ( target.isRetained() && !target.isActive() ) {
                    record = this.history( 0 );
                    target = record && target.query( record.state ) || target;
                }

                // A transition cannot target an abstract state directly, so `target` must be
                // reassigned to the appropriate concrete substate.
                while ( target.isAbstract() ) {
                    target = target.defaultSubstate();
                    if ( !target ) return null;
                }
                
                !options && ( options = {} ) ||
                    Z.isArray( options ) && ( options = { arguments: options } );

                // If any guards are in place for the given `origin` and `target` states, they must
                // consent to the transition, unless we specify that it be `forced`.
                if ( !options.forced && (
                        !evaluateGuard.call( origin, 'release', target ) ||
                        !evaluateGuard.call( target, 'admit', origin )
                ) ) {
                    typeof options.failure === 'function' && options.failure.call( this );
                    return null;
                }

                // If `target` is a state from a prototype of `owner`, it must be represented
                // here as a transient virtual state.
                target && target.controller() !== this &&
                    ( target = virtualize.call( this, target ) );
                
                // If a previously initiated transition is still underway, it needs to be
                // notified that it won’t finish.
                transition && transition.abort();
                
                // The `source` variable will reference the previously current state (or abortive
                // transition).
                source = state = this.current();

                // The upcoming transition will start from its `source` and proceed within the
                // `domain` of the least common ancestor between that state and the specified
                // target.
                domain = source.common( target );
                
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
                while ( state !== domain ) {
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
                        if ( state.isShallow() ) {
                            state.hasHistory() && push.call( state, substate );
                        }
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
                        if ( !state.isShallow() ) {
                            state.hasHistory() && push.call( state, target );
                        }
                    }

                    // Any virtual states that were previously active are no longer needed.
                    if ( origin.isVirtual() ) {
                        annihilate.call( this, origin );
                        origin = null;
                    }

                    // Now complete, the `Transition` instance can be discarded.
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
    
    // ### Prototype methods

    Z.assign( StateController.prototype, {

        // #### toString
        // 
        toString: function () {
            return this.current().toString();
        },

        // #### getTransitionExpressionFor
        // 
        // Finds the appropriate transition expression for the given origin and target states. If
        // no matching transitions are defined in any of the states, returns a generic actionless
        // transition expression for the origin/target pair.
        getTransitionExpressionFor: function ( target, origin ) {
            origin || ( origin = this.current() );
            
            function search ( state, until ) {
                var transitions, key, expr;
                for ( ; state && state !== until; state = until ? state.superstate() : null ) {
                    transitions = state.transitions();
                    for ( key in transitions ) if ( Z.hasOwn.call( transitions, key ) ) {
                        expr = transitions[ key ];
                        if (
                            ( !expr.guard || expr.guard.call( origin, target ) )
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

// <a id="state-event" />

// ## StateEvent
// 
// When an event is emitted from a state, it passes a `StateEvent` object to any bound listeners,
// containing the `type` string and a reference to the contextual `state`.

var StateEvent = ( function () {

    // ### Constructor
    function StateEvent ( state, type ) {
        Z.assign( this, {
            target: state,
            name: state.toString(),
            type: type
        });
    }

    StateEvent.prototype.toString = function () {
        return 'StateEvent (' + this.type + ') ' + this.name;
    };
    
    return StateEvent;
})();

// <a id="state-event-collection" />

// ## StateEventCollection
// 
// A state holds event listeners for each of its various event types in a `StateEventCollection`
// instance.

var StateEventCollection = ( function () {
    var guid = 0;

    // ### Constructor
    function StateEventCollection ( state, type ) {
        this.state = state;
        this.type = type;
        this.items = {};
        this.length = 0;
    }

    Z.assign( StateEventCollection.prototype, {
        // #### guid
        // 
        // Produces a unique numeric string, to be used as a key for bound event listeners.
        guid: function () {
            return ( ++guid ).toString();
        },

        // #### get
        // 
        // Retrieves a bound listener associated with the provided `id` string as returned by
        // the prior call to `add`.
        get: function ( id ) {
            return this.items[id];
        },

        // #### key
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( listener ) {
            var i, items = this.items;
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                if ( items[i] === listener ) return i;
            }
        },

        // #### keys
        // 
        // Returns the set of `id` strings associated with all bound listeners.
        keys: function () {
            var i, items = this.items, result = [];

            result.toString = function () { return '[' + result.join() + ']'; };
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // #### add
        // 
        // Binds a listener, along with an optional context object, to be called when the
        // the collection `emit`s an event. Returns a unique key that can be used later to
        // `remove` the listener.
        // 
        // *Aliases:* **on bind**
        add: function (
            /*Function*/ fn,
              /*Object*/ context  // optional
        ) {
            var id = this.guid();
            this.items[id] = typeof context === 'object' ? [ fn, context ] : fn;
            this.length++;
            return id;
        },

        // #### remove
        // 
        // Unbinds a listener. Accepts either the numeric string returned by `add` or a reference
        // to the function itself.
        // 
        // *Aliases:* **off unbind**
        remove: function ( /*Function | String*/ id ) {
            var fn, i, l,
                items = this.items;
            
            fn = items[ typeof id === 'function' ? this.key( id ) : id ];
            if ( !fn ) return false;
            delete items[id];
            this.length--;
            return fn;
        },

        // #### empty
        empty: function () {
            var i, items = this.items;

            if ( !this.length ) return false;

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return true;
        },

        // #### emit
        // 
        // Emits a `StateEvent` to all bound listeners.
        // 
        // *Alias:* **trigger**
        emit: function ( args, state ) {
            var i, item, itemType, fn, context, target,
                items = this.items, type = this.type;
            
            state || ( state = this.state );

            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                item = items[i], itemType = Z.type( item );

                if ( itemType === 'function' ) {
                    fn = item, context = state;
                }
                else if ( itemType === 'array' ) {
                    fn = item[0], context = item[1];
                }

                // If `item` is a String or State, interpret this as an implied transition to be
                // instigated after all of the callbacks have been invoked.
                else if ( itemType === 'string' || item instanceof State ) {
                    target = item;
                    continue;
                }

                fn.apply( context, [ new StateEvent( state, type ) ].concat( args ) );
                fn = context = null;
            }

            target && state.change( target );
        },

        // #### destroy
        destroy: function () {
            this.empty();
            delete this.state, delete this.type, delete this.items, delete this.length;
            return true;
        }
    });
    Z.alias( StateEventCollection.prototype, {
        add: 'on bind',
        remove: 'off unbind',
        emit: 'trigger'
    });

    return StateEventCollection;
})();


// ## Transition
// 
// A **transition** is a transient `State` adopted by a controller as it changes from one of its
// proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor* between its **origin**
// and **target** states. During this time it behaves as if it were a substate of that domain
// state, inheriting method calls and propagating events in the familiar fashion.

var Transition = ( function () {
    Z.inherit( Transition, State );

    // ### Constructor
    function Transition ( target, source, expression, callback ) {
        if ( !( this instanceof Transition ) ) {
            return TransitionExpression.apply( this, arguments );
        }
        
        var self = this,
            methods = {},
            events = {},
            guards = {},

            // The **action** of a transition is a function that will be called after the
            // transition has been `start`ed. This function, if provided, is responsible for
            // calling `end()` on the transition at some point in the future.
            action = expression.action,

            attachment = source,
            controller, aborted;
        
        controller = source.controller();
        if ( controller !== target.controller() ) {
            controller = undefined;
        }

        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this.__private__ = {}, {
            methods: methods,
            events: events,
            action: action
        });

        Z.assign( this, {
            // #### superstate
            // 
            // In a transition, `superstate` is used to track its position as it traverses the
            // `State` subtree that defines its domain.
            superstate: function () { return attachment; },

            // #### attachTo
            attachTo: function ( state ) { return attachment = state; },

            // #### controller
            controller: function () { return controller; },

            // #### origin
            // 
            // A transition's **origin** is the controller’s most recently active `State` that is
            // not itself a `Transition`.
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // #### source
            // 
            // A transition’s **source** is the `State` or `Transition` that immediately preceded
            // `this`.
            source: function () { return source; },

            // #### target
            // 
            // The intended destination `State` for this transition. If a target is invalidated by
            // a controller that `change`s state again before this transition completes, then this
            // transition is aborted and the `change` call will create a new transition that is
            // `source`d from `this`.
            target: function () { return target; },

            // #### setCallback
            // 
            // Allows the callback function to be set or changed prior to the transition’s
            // completion.
            setCallback: function ( fn ) { return callback = fn; },

            // #### aborted
            aborted: function () { return aborted; },
            
            // #### start
            // 
            // Starts the transition; if an `action` is defined, that function is responsible
            // for declaring an end to the transition by calling `end()`. Otherwise, the
            // transition is necessarily synchronous and is concluded immediately.
            start: function () {
                aborted = false;
                this.emit( 'start', arguments, false );
                if ( action && Z.isFunction( action ) ) {
                    action.apply( this, arguments );
                    return this;
                } else {
                    return this.end.apply( this, arguments );
                }
            },
            
            // #### abort
            // 
            // Indicates that a transition won’t directly reach its target state; for example, if a
            // new transition is initiated while an asynchronous transition is already underway,
            // that previous transition is aborted. The previous transition is retained as the
            // `source` for the new transition.
            abort: function () {
                aborted = true;
                callback = null;
                this.emit( 'abort', arguments, false );
                return this;
            },
            
            // #### end
            // 
            // Indicates that a transition has completed and has reached its intended target. The
            // transition is subsequently retired, along with any preceding aborted transitions.
            end: function () {
                if ( !aborted ) {
                    this.emit( 'end', arguments, false );
                    callback && callback.apply( controller, arguments );
                }
                this.destroy();
                return target;
            },
            
            // #### destroy
            // 
            // Destroys this transition and clears its held references, and does the same for any
            // aborted `source` transitions that preceded it.
            destroy: function () {
                source instanceof Transition && source.destroy();
                target = attachment = controller = null;
            }
        });
        Z.privilege( this, State.privileged, {
            'init' : [ TransitionExpression ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );
        
        this.init( expression );
        expression = null;
    }

    Transition.prototype.depth = function () {
        var count = 0, transition = this, source;
        while ( ( source = transition.source() ) instanceof Transition ) {
            transition = source;
            count++;
        }
        return count;
    };
    
    return Transition;
})();

// ## TransitionExpression
// 
// A state may hold **transition expressions** that describe the transition that will take place
// between any two given **origin** and **target** states.

var TransitionExpression = ( function () {
    var properties   = Z.assign( TRANSITION_PROPERTIES, null ),
        categories   = Z.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = Z.assign( TRANSITION_EVENT_TYPES ),
        guardActions = Z.assign( GUARD_ACTIONS );
    
    // ### Constructor
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        Z.extend( true, this, map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // ### Static functions

    // #### interpret
    // 
    // Rewrites a plain object map as a well-formed `TransitionExpression`, making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var result = Z.extend( {}, properties, categories ),
            key, value, category, events;
        
        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                Z.extend( result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ? 'events' :
                    key in guardActions ? 'guards' :
                    'methods';
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }
        }
        for ( key in ( events = result.events ) ) {
            Z.isFunction( value = events[ key ] ) && ( events[ key ] = [ value ] );
        }

        return result;
    }

    return TransitionExpression;
})();


// Make the set of defined classes available as members of the exported module.
Z.assign( state, {
    State: State,
    StateExpression: StateExpression,
    StateController: StateController,
    StateEvent: StateEvent,
    StateEventCollection: StateEventCollection,
    Transition: Transition,
    TransitionExpression: TransitionExpression
});

}).call( this );

