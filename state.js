// Copyright (C) 2011-2012
// Nick Fargo, Z Vector Inc.
// 
// [`LICENSE`](https://github.com/nickfargo/state/blob/master/LICENSE) MIT.
// 
// **State** is a micro-framework for implementing state-driven behavior directly into any
// JavaScript object.
// 
// [statejs.org](http://statejs.org/)
// 
// <a class="icon-large icon-octocat" href="http://github.com/nickfargo/state/"></a>

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
        })(),

        options: {
            memoizeProtostates: true
        }
    },

    // The lone dependency of the **State** module is
    // [Zcore](http://github.com/zvector/zcore), a library that assists with tasks such as object
    // manipulation, differential operations, and facilitation of prototypal inheritance.
    Z = typeof require !== 'undefined' ? require('zcore') : global.Z;


// ## state( ... ) <a class="icon-link" name="module" href="#module"></a>
// 
// The `state` module is exported as a function. This is used either: (1) to generate a formal
// [`StateExpression`](#state-expression); or (2) to bestow an arbitrary `owner` object with a
// new implementation of state based on the supplied `expression`, returning the owner’s initial
// [`State`](#state).
// 
// All arguments are optional. If both an `owner` and `expression` are provided, `state` acts in
// the second capacity, causing `owner` to become stateful; otherwise, `state` simply returns a
// `StateExpression`. The `attributes` parameter may include any of the words defined in
// [`STATE_ATTRIBUTE_MODIFIERS`](#module--constants--state-attribute-modifiers); these are encoded
// into the provided `expression`, and will be used to further specify the expressed state’s
// functionality, or to impose constraints on how that state may be used by its owner.
// 
// *See also:* [`State`](#state), [`STATE_ATTRIBUTES`](#module--constants--state-attributes),
// [`StateExpression`](#state-expression), [`StateController`](#state-controller)
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


// <a class="icon-link" name="module--constants" href="#module--constants"></a>
// 
// ### Module-level constants

// <a class="icon-link"
//    name="module--constants--state-attributes"
//    href="#module--constants--state-attributes"></a>
// 
// #### State attributes
// 
// Attribute values are stored as a bit field in a [`State`](#state) instance. Most attributes
// enumerated here also correspond with a [modifier](#module--constants--state-attribute-modifiers)
// keyword that can be included in a call to [`state()`](#module).
var STATE_ATTRIBUTES = {
    NORMAL      : 0x0,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--virtual"
    //    href="#module--constants--state-attributes--virtual"></a>
    // 
    // ##### virtual
    // 
    // A **virtual state** is a lightweight inheritor of a **protostate** located higher in the
    // owner object’s prototype chain. Notably, as virtual states are created automatically, no
    // modifier keyword exists for the `virtual` attribute.
    VIRTUAL     : 0x1,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--mutable"
    //    href="#module--constants--state-attributes--mutable"></a>
    // 
    // ##### mutable
    // 
    // By default, states are **weakly immutable**; i.e., once a `State` has been constructed, its
    // declared data, methods, guards, substates, and transitions cannot be altered. By including
    // the `mutable` attribute in the state’s expression, this restriction is lifted. Mutability
    // is also inherited from any of a state’s superstates or protostates.
    MUTABLE     : 0x2,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--finite"
    //    href="#module--constants--state-attributes--finite"></a>
    // 
    // ##### finite
    // 
    // If a state is declared `finite`, no substates or descendant states may be added, nor may
    // any be removed without also destroying the state itself.
    FINITE      : 0x4,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--immutable"
    //    href="#module--constants--state-attributes--immutable"></a>
    // 
    // ##### immutable
    // 
    // Adding the `immutable` attribute causes a state to become **strongly immutable**, wherein
    // it guarantees immutability absolutely, throughout all inheriting states, overriding and
    // negating any included or inherited `mutable` attributes.
    IMMUTABLE   : 0x8,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--initial"
    //    href="#module--constants--state-attributes--initial"></a>
    // 
    // ##### initial
    // 
    // Marking a state `initial` specifies which state a newly stateful object should assume.
    INITIAL     : 0x10,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--conclusive"
    //    href="#module--constants--state-attributes--conclusive"></a>
    // 
    // ##### conclusive
    // 
    // Once a state marked `conclusive` is entered, it cannot be exited, although transitions
    // may still freely traverse within its substates.
    CONCLUSIVE  : 0x20,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--final"
    //    href="#module--constants--state-attributes--final"></a>
    // 
    // ##### final
    // 
    // Once a state marked `final` is entered, no further outbound transitions within its local
    // region are allowed.
    FINAL       : 0x40,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--abstract"
    //    href="#module--constants--state-attributes--abstract"></a>
    // 
    // ##### abstract
    // 
    // An `abstract` state is used only as a source of inheritance, and cannot itself be current.
    // Consequently a transition that targets an abstract state will be automatically redirected
    // to one of its substates.
    ABSTRACT    : 0x80,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--default"
    //    href="#module--constants--state-attributes--default"></a>
    // 
    // ##### default
    // 
    // Marking a state `default` designates it as the actual target for any transition that
    // targets its abstract superstate.
    DEFAULT     : 0x100,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--sealed"
    //    href="#module--constants--state-attributes--sealed"></a>
    // 
    // ##### sealed
    // 
    // A state marked `sealed` cannot have substates.
    SEALED      : 0x200,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--history"
    //    href="#module--constants--state-attributes--history"></a>
    // 
    // ##### history
    // 
    // Marking a state with the `history` attribute causes its internal state to be recorded
    // in a sequential **history**. Whereas a `retained` state is concerned only with the most
    // recent internal state, a state’s history can be traversed and altered, resulting in
    // transitions back or forward to previously or subsequently held internal states.
    HISTORY     : 0x400,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--retained"
    //    href="#module--constants--state-attributes--retained"></a>
    // 
    // ##### retained
    // 
    // A `retained` state is one that preserves its own internal state, such that, after the
    // state has become no longer active, a subsequent transition targeting that particular
    // state will automatically be redirected to whichever of its descendant states was most
    // recently current.
    RETAINED    : 0x800,

    // <a class="icon-link"
    //    name="module--constants--state-attributes--shallow"
    //    href="#module--constants--state-attributes--shallow"></a>
    // 
    // ##### shallow
    // 
    // Normally, states that are `retained` or that keep a `history` persist their internal
    // state *deeply*, i.e., with a scope extending over all of the state’s descendant states.
    // Marking a state `shallow` limits the scope of its persistence to its immediate
    // substates only.
    SHALLOW     : 0x1000,

    // ##### versioned
    // 
    // Causes alterations to a state to result in a reflexive transition, with a delta object
    // distinguishing the prior version of the state from its new version. Should also add a
    // history entry wherever appropriate, representing the prior version and the delta.
    // *(Reserved; not presently implemented.)*
    VERSIONED   : 0x2000,

    // ##### concurrent
    // 
    // In a state marked `concurrent`, the substates are considered **concurrent orthogonal
    // regions**. Upon entering a concurrent state, the controller creates a new set of
    // subcontrollers, one for each region, which will exist as long as the concurrent state
    // remains active. Method calls are forwarded to at most one of the regions, or if a
    // reduction function is associated with the given method, the call is repeated for each
    // region and the results reduced accordingly on their way back to the owner.
    // *(Reserved; not presently implemented.)*
    CONCURRENT  : 0x4000
//
};

// <a class="icon-link"
//    name="module--constants--state-attribute-modifiers"
//    href="#module--constants--state-attribute-modifiers"></a>
// 
// #### State attribute modifiers
// 
// The subset of attributes that are valid keywords for the `attributes` argument in a call to
// the exported [`state`](#module) function.
var STATE_ATTRIBUTE_MODIFIERS = [
        'mutable finite immutable',
        'initial conclusive final',
        'abstract default sealed',
        'history retained shallow versioned',
        'concurrent'
    ].join(' ');

// <a class="icon-link"
//    name="module--constants--state-expression-categories"
//    href="#module--constants--state-expression-categories"></a>
// 
var STATE_EXPRESSION_CATEGORIES =
        'data methods events guards states transitions';

// <a class="icon-link"
//    name="module--constants--state-event-types"
//    href="#module--constants--state-event-types"></a>
// 
var STATE_EVENT_TYPES =
        'construct depart exit enter arrive destroy mutate';

// <a class="icon-link"
//    name="module--constants--guard-actions"
//    href="#module--constants--guard-actions"></a>
// 
var GUARD_ACTIONS =
        'admit release';

// <a class="icon-link"
//    name="module--constants--transition-properties"
//    href="#module--constants--transition-properties"></a>
// 
var TRANSITION_PROPERTIES =
        'origin source target action conjugate';

// <a class="icon-link"
//    name="module--constants--transition-expression-categories"
//    href="#module--constants--transition-expression-categories"></a>
// 
var TRANSITION_EXPRESSION_CATEGORIES =
        'methods events guards';

// <a class="icon-link"
//    name="module--constants--transition-event-types"
//    href="#module--constants--transition-event-types"></a>
// 
var TRANSITION_EVENT_TYPES =
        'construct destroy enter exit start end abort';

// The [`state`](#module) module is exported via CommonJS on the server, and globally in the
// browser.
Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

// <a class="icon-link" name="module--constants--module" href="#module--constants--module"></a>
// 
// #### module
// 
// References or creates a unique object visible only within the lexical scope of this module.
var __MODULE__ = Z.env.server ? module : { exports: state };

// ## State <a class="icon-link" name="state" href="#state"></a>
// 
// A **state** models a set of behaviors on behalf of an owner object. The owner may undergo
// **transitions** that change its **current** state from one to another, and in so doing adopt a
// different set of behaviors.
// 
// Distinct behaviors are modeled in each state by defining a set of method overrides, to which
// calls made on the owner will be redirected so long as a state remains current.
// 
// States are structured as a rooted tree, where **substates** inherit from a single
// **superstate**. While a substate is current, it and all of its ancestor superstates are
// considered to be **active**.
// 
// In addition, a state also recognizes the owner object’s prototypal inheritance, identifying an
// identically named and positioned state in the prototype as its **protostate**. Stateful
// behavior is inherited *from protostates first*, then from superstates.

var State = ( function () {
    var SA = STATE_ATTRIBUTES,

        PROTOSTATE_HERITABLE_ATTRIBUTES =
            SA.MUTABLE    |  SA.FINITE      |  SA.IMMUTABLE  |
            SA.INITIAL    |  SA.CONCLUSIVE  |  SA.FINAL      |
            SA.ABSTRACT   |  SA.DEFAULT     |  SA.SEALED     |
            SA.HISTORY    |  SA.RETAINED    |  SA.SHALLOW    |
            SA.CONCURRENT;


    Z.assign( State, SA );

    // <a class="icon-link" name="state--constructor" href="#state--constructor"></a>
    // 
    // ### Constructor
    // 
    // 
    function State ( superstate, name, expression ) {
        if ( !( this instanceof State ) ) {
            return new State( superstate, name, expression );
        }

        var attributes, controller, superstateAttributes, protostate, protostateAttributes;

        attributes = expression && expression.attributes || SA.NORMAL;

        // #### name
        // 
        // Returns the local name of this state.
        this.name = Z.stringFunction( function () { return name || ''; } );

        // A root state is created by a [`StateController`](#state-controller), which passes a
        // reference to itself into the `superstate` parameter, signaling that a `controller`
        // method closing over the reference needs to be created for this instance.
        if ( superstate instanceof StateController ) {
            controller = superstate, superstate = undefined;
            controller.root = Z.thunk( this );
            this.controller = Z.thunk( controller );
        }

        // Otherwise this state is an inheritor of an existing superstate.
        else if ( superstate ) {
            this.superstate = privileged.superstate( superstate );

            // The `mutable` and `finite` attributes are inherited from the superstate.
            superstateAttributes = superstate.attributes();
            attributes |= superstateAttributes & ( SA.MUTABLE | SA.FINITE );
        }

        // The set of “protostate-heritable” attributes are inherited from the protostate.
        if ( protostate = this.protostate() ) {
            protostateAttributes = protostate.attributes();
            attributes |= protostateAttributes & PROTOSTATE_HERITABLE_ATTRIBUTES;
        }

        // Explicit or inherited `immutable` contradicts `mutable` and implies `finite`.
        attributes |= ( superstateAttributes | protostateAttributes ) & SA.IMMUTABLE;
        if ( attributes & SA.IMMUTABLE ) {
            attributes &= ~SA.MUTABLE;
            attributes |= SA.FINITE;
        }

        // Only a few instance methods are required for a virtual state, including one
        // ([`realize`](#state--privileged--realize)) method which if called later will convert
        // the virtual state into a real state.
        if ( attributes & SA.VIRTUAL ) {
            this.attributes = privileged.attributes( attributes );
            this.realize = privileged.realize( attributes );
            attributes & SA.MUTABLE && Z.assign( this, mutableVirtualMethods );
        }

        // For a real state, the remainder of construction is delegated to the class-private
        // [`realize`](#state--private--realize) function.
        else {
            realize.call( this, superstate, attributes, expression );
        }

        // Additional property assignments for easy viewing in the inspector.
        if ( Z.env.debug ) {
            this[' <owner>'] = this.owner();
            this[' <path>']  = this.derivation( true ).join('.');
            this['<attr>']   = StateExpression.decodeAttributes( attributes );
        }
    }

    // ### Class-private entities

    // <a class="icon-link" name="state--private--realize" href="#state--private--realize"></a>
    // 
    // #### realize
    // 
    // Continues construction for an incipient or virtual [`State`](#state) instance.
    // 
    // Much of the initialization for `State` is offloaded from the
    // [constructor](#state--constructor), allowing for creation of lightweight virtual `State`
    // instances that inherit all of their functionality from protostates, but can also be
    // converted later to a real `State` if necessary.
    // 
    // *See also:* [`StateController virtualize`](#state-controller--private--virtualize),
    // [`State.privileged.realize`](#state--privileged--realize)
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
            history     = attributes & SA.HISTORY || attributes & SA.RETAINED ?
                new StateHistory( this ) :
                null;

        // Method names are mapped to specific local variables. The named methods are created on
        // `this`, each of which is a partial application of its corresponding method factory at
        // [`State.privileged`](#state--privileged).
        Z.privilege( this, privileged, {
            'peek express' : [ StateExpression, attributes, data, methods, events, guards,
                substates, transitions, history ],
            'superstate' : [ superstate ],
            'attributes' : [ attributes ],
            'data' : [ attributes, data ],
            'method methodNames' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard' : [ guards ],
            'substate substates' : [ substates ],
            'transition transitions' : [ transitions ],
            'destroy' : [ function ( s ) { return superstate = s; }, methods, events, substates ]
        });
        if ( 1 || attributes & SA.MUTABLE ) {
            this.mutate             = privileged.mutate( StateExpression, attributes, data,
                                            methods, events, guards, substates, transitions );
            addMethod =
            this.addMethod          = privileged.addMethod( methods );
            this.removeMethod       = privileged.removeMethod( methods );
            this.addGuard           = privileged.addGuard( guards );
            this.removeGuard        = privileged.removeGuard( guards );
            this.addSubstate        = privileged.addSubstate( attributes, substates );
            this.removeSubstate     = privileged.removeSubstate( attributes, substates );
            this.addTransition      = privileged.addTransition( transitions );
            this.removeTransition   = privileged.removeTransition( transitions );
        }
        history && Z.privilege( this, privileged, {
            'history push replace' : [ history ]
        });

        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );

        // With the instance methods in place, `this` is now ready to apply `expression` to itself.
        privileged.init( StateExpression ).call( this, expression );

        // Realizing a root state requires that, for any of the owner’s own methods for which exist
        // at least one stateful implementation located higher in its prototype chain, that method
        // must be copied into the root to define the object’s default behavior.
        if ( !superstate && ( owner = this.owner() ) ) {
            addMethod || ( addMethod = privileged.addMethod( methods ) );

            for ( key in owner ) if ( Z.hasOwn.call( owner, key ) ) {
                method = owner[ key ];
                if ( Z.isFunction( method ) && !method.isDelegator && this.method( key, false ) ) {
                    addMethod.call( this, key, method );
                }
            }
        }

        // If the state is `finite` or non-`mutable`, then the appropriate mutation methods used
        // during construction/realization can no longer be used, and must be removed.
        if ( ~attributes & SA.MUTABLE ) {
            Z.forEach( 'mutate addMethod removeMethod addGuard removeGuard addTransition \
                removeTransition'.split(/\s+/), function ( m ) { delete self[ m ] } );
        }
        if ( ~attributes & SA.MUTABLE || attributes & SA.FINITE ) {
            delete this.addSubstate;
            delete this.removeSubstate;
        }

        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this, { __private__: this.peek( __MODULE__ ) } );

        return this;
    }

    // <a class="icon-link"
    //    name="state--private--create-delegator"
    //    href="#state--private--create-delegator"></a>
    // 
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
    // Stateful methods are applied in the context of the [`State`](#state) to which they belong,
    // or, if a method is inherited from a protostate, the context will be the corresponding
    // virtual state within the local [`StateController`](#state-controller). However, for any
    // a priori methods relocated to the root state, the context appropriately remains bound to
    // the owner object.
    // 
    // *See also:* [`State.privileged.addMethod`](#state--privileged--add-method)
    function createDelegator ( accessorKey, methodName, original ) {
        function delegator () {
            return this[ accessorKey ]().apply( methodName, arguments );
        }

        delegator.isDelegator = true;
        Z.env.debug && ( delegator.toString = function () { return "[delegator]" } );

        original && ( delegator.original = original );

        return delegator;
    }

    // <a class="icon-link"
    //    name="state--private--mutable-virtual-methods"
    //    href="#state--private--mutable-virtual-methods"></a>
    // 
    // #### mutableVirtualMethods
    // 
    // A set of methods that will be mixed into mutable virtual states. When called, these first
    // [`realize`](#state--private--realize) the state and then, provided that realization has
    // successfully produced a new method of the same name on the instance, invoke that method.
    var mutableVirtualMethods = ( function () {
        var obj = {},
            names = 'addMethod addEvent addGuard addSubstate addTransition';

        Z.forEach( names.split(' '), function ( name ) {
            function realizer () {
                var method = this.realize()[ name ];
                if ( method !== realizer ) return method.apply( this, arguments );
            }
            obj[ name ] = realizer;
        });

        return obj;
    })();

    // <a class="icon-link" name="state--privileged" href="#state--privileged"></a>
    // 
    // ### Privileged methods
    // 
    // Methods defined here typically are partially applied either within or down-stack from
    // the invocation of [`State`](#state) or an inheriting constructor (e.g.,
    // [`Transition`](#transition)).
    var privileged = State.privileged = {

        // <a class="icon-link" name="state--privileged--peek" href="#state--privileged--peek"></a>
        // 
        // #### peek
        // 
        // Exposes private entities to code within the same module-level lexical scope. Callers
        // must authenticate themselves as internal by providing a `referenceToModule` that
        // matches the closed unique module-scoped object `__MODULE__` (which in a CommonJS
        // environment is equivalent to the standard `module`).
        peek: function (
                /*Function*/ expressionConstructor,
                  /*Number*/ attributes,
                  /*Object*/ data, methods, events, guards, substates, transitions,
            /*StateHistory*/ history
        ) {
            var members = {
                    expressionConstructor: expressionConstructor,
                    attributes: attributes,
                    data: data,
                    methods: methods,
                    events: events,
                    guards: guards,
                    substates: substates,
                    transitions: transitions,
                    history: history
                };

            return function (
                /*<module>*/ referenceToModule,
                  /*String*/ name
            ) {
                if ( referenceToModule !== __MODULE__ ) throw ReferenceError;
                return name ? members[ name ] : Z.clone( members );
            };
        },

        // <a class="icon-link" name="state--privileged--init" href="#state--privileged--init"></a>
        // 
        // #### init
        // 
        // Builds out the state’s members based on the expression provided.
        init: function ( /*Function*/ expressionConstructor ) {
            return function ( /*<expressionConstructor> | Object*/ expression ) {
                this.__initializing__ = true;
                this.mutate( expression );
                delete this.__initializing__;
                this.emit( 'construct', expression, false );
                return this;
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--realize"
        //    href="#state--privileged--realize"></a>
        // 
        // #### realize
        // 
        // Transforms a virtual state into a “real” state.
        // 
        // A virtual state is a lightweight [`State`](#state) instance whose purpose is simply to
        // inherit from its protostate. As such virtual states are weakly bound to a state
        // hierarchy by their reference held at `superstate`, and are not proper members of the
        // superstate’s set of substates. Transforming the state from virtual to real causes it to
        // exist thereafter as an abiding member of its superstate’s set of substates.
        // 
        // *See also:* [`State realize`](#state--private--realize) 
        realize: function ( attributes ) {
            return function ( expression ) {
                var superstate = this.superstate(),
                    addSubstate = Z.hasOwn.call( superstate, 'addSubstate' ) ?
                        superstate.addSubstate :
                        privileged.addSubstate(
                            superstate.peek( __MODULE__, 'attributes' ),
                            superstate.peek( __MODULE__, 'substates' )
                        );
                delete this.realize;
                if ( addSubstate.call( superstate, this.name(), this ) ) {
                    realize.call( this, superstate, attributes & ~SA.VIRTUAL, expression );
                }
                return this;
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--express"
        //    href="#state--privileged--express"></a>
        // 
        // #### express
        // 
        // Returns an expression that describes the state’s contents. By default the expression is
        // returned as a plain `Object`; if `typed` is truthy the expression is a formally typed
        // [`StateExpression`](#state-expression).
        express: ( function () {
            function clone ( obj ) {
                if ( obj === undefined ) return;
                var out = null, key, value;
                for ( key in obj ) {
                    value = obj[ key ];
                    ( out || ( out = {} ) )[ key ] = value && typeof value === 'object' ?
                        Z.clone( obj[ key ] ) :
                        value;
                }
                return out;
            }

            function cloneEvents ( events ) {
                if ( events === undefined ) return;
                var out = null, type, collection;
                for ( type in events ) if ( collection = events[ type ] ) {
                    ( out || ( out = {} ) )[ type ] = Z.clone( collection.items );
                }
                return out;
            }

            function recurse ( substates, typed ) {
                if ( substates === undefined ) return;
                var out = null;
                Z.forEach( substates, function ( substate, name ) {
                    ( out || ( out = {} ) )[ name ] = substate.express( typed );
                });
                return out;
            }

            return function (
                /*Function*/ expressionConstructor,
                  /*Number*/ attributes,
                  /*Object*/ data, methods, events, guards, substates, transitions
            ) {
                return function ( /*Boolean*/ typed ) {
                    var expression = {};

                    Z.edit( expression, {
                        attributes:  attributes,
                        data:        clone( data ),
                        methods:     clone( methods ),
                        events:      cloneEvents( events ),
                        guards:      clone( guards ),
                        states:      recurse( substates, typed ),
                        transitions: clone( transitions )
                    });

                    return typed ? new expressionConstructor( expression ) : expression;
                };
            };
        })(),

        // <a class="icon-link"
        //    name="state--privileged--mutate"
        //    href="#state--privileged--mutate"></a>
        // 
        // #### mutate
        // 
        // Transactionally mutates the state by adding, updating, or removing items as specified
        // by the expression provided in `expr`. 
        mutate: function (
            /*Function*/ expressionConstructor,
              /*Number*/ attributes,
              /*Object*/ data, methods, events, guards, substates, transitions
        ) {
            return function (
                /*<expressionConstructor> | Object*/ expr
            ) {
                expr instanceof expressionConstructor ||
                    ( expr = new expressionConstructor( expr ) );

                var self = this,
                    NIL = Z.NIL,
                    before, collection, name, value, after, delta;

                var addMethod, removeMethod;

                // The privileged `init` function uses `mutate` for the state’s initial build,
                // but with the resultant `mutate` event suppressed.
                if ( !this.__initializing__ ) {
                    // A snapshot of the `before` condition of this state is taken, to be compared
                    // later with an `after` snapshot.
                    before = this.express();
                }

                // This invocation of `mutate` utilizes the set of privileged `add*` methods,
                // however, since they are being called as part of a single operation, each must
                // suppress its usual emission of its own `mutate` event.
                this.__atomic__ = true;

                // Data is already set up to handle differentials that contain `NIL` values.
                expr.data && this.data( expr.data );

                // Methods are stored as a simple key mapping, and
                // [`addMethod`](#state--privileged--add-method) can be used both to create an
                // entry and to update an existing entry, without any additional side-effects, so
                // method expressions can simply be compared against the `NIL` value.
                collection = expr.methods;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    value !== NIL ? this.addMethod( name, value ) : this.removeMethod( name );
                }

                // Event listeners for a given event type might be expressed as a simple `Array`
                // of items to be added, as a plain `Object` that maps items to specific keys in
                // the internal event collection that should be updated or deleted, or as an
                // `Array` that also includes one or more such `Object`s.
                expr.events && Z.forEach( expr.events, function ( object, type ) {
                    var items, edit, add, i, l,
                        eventCollection = events[ type ];

                    if ( object === NIL ) return eventCollection && eventCollection.empty();

                    // If an event collection object does not already exist for this event type,
                    // then one will be created, so long as `object` is expected to contain items
                    // to be added.
                    if ( !eventCollection && object && !Z.isEmpty( object ) ) {
                        eventCollection = events[ type ] = new StateEventCollection( self, type );
                    }

                    items = eventCollection.items;

                    edit = function ( object ) {
                        var key, value;
                        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
                            value = object[ key ];
                            if ( value === NIL ) {
                                eventCollection.remove( key );
                            } else if ( value && value !== items[ key ] ) {
                                eventCollection.set( key, value );
                            }
                        }
                    };

                    if ( Z.isArray( object ) ) {
                        add = function ( object ) { return self.addEvent( type, object ); };
                        for ( i = 0, l = object.length; i < l; i++ ) {
                            value = object[i];
                            if ( value == null || value === NIL ) continue;
                            ( Z.isPlainObject( value ) ? edit : add )( value );
                        }
                    } else if ( Z.isPlainObject( object ) ) {
                        edit( object );
                    }

                    eventCollection.length || eventCollection.destroy() && delete events[ type ];
                });

                // Guards are stored as simple objects, and altering them causes no side-effects,
                // so a deep `edit` is sufficient.
                expr.guards && Z.edit( 'deep', guards, expr.guards );

                // Substates are instances of [`State`](#State), which are either created,
                // destroyed, or recursively updated in place, as specified by `expr.states`.
                collection = expr.states;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    if ( name in substates ) {
                        value === NIL ?
                            substates[ name ].destroy() :
                            substates[ name ].mutate( value, false );
                    } else {
                        this.addSubstate( name, value );
                    }
                }

                // Transitions are instances of [`TransitionExpression`](#transition-expression),
                // which are either created, deleted, or replaced, as specified by
                // `expr.transitions`.
                collection = expr.transitions;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    if ( name in transitions ) {
                        if ( value === NIL ) {
                            delete transitions[ name ];
                        } else {
                            transitions[ name ] = new TransitionExpression( value );
                        }
                    } else {
                        this.addTransition( name, value );
                    }
                }

                // Allow `add*` methods to emit individual `mutate` events normally.
                delete this.__atomic__;

                // Finally the `before` snapshot is put to use in a `mutate` event.
                if ( before ) {
                    after = this.express();
                    delta = Z.diff( before, after );
                    if ( !Z.isEmpty( delta ) ) {
                        this.emit( 'mutate', [ expr, before, after, delta ], false );
                    }
                }

                return this;
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--superstate"
        //    href="#state--privileged--superstate"></a>
        // 
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

        // <a class="icon-link"
        //    name="state--privileged--attributes"
        //    href="#state--privileged--attributes"></a>
        // 
        // #### attributes
        // 
        // Returns the bit-field representing the state’s attribute flags.
        attributes: function ( /*Number*/ attributes ) {
            return function () { return attributes; };
        },

        // <a class="icon-link" name="state--privileged--data" href="#state--privileged--data"></a>
        // 
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
        data: function (
            /*Number*/ attributes,
            /*Object*/ data
        ) {
            return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
                var edit, delta, state, superstate, protostate;

                if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                    edit = viaSuper, viaSuper = viaProto = false;
                } else {
                    viaSuper === undefined && ( viaSuper = true );
                    viaProto === undefined && ( viaProto = true );
                }

                if ( edit && attributes & SA.MUTABLE && !Z.isEmpty( edit ) ) {
                    if ( attributes & SA.VIRTUAL ) return this.realize().data( edit );

                    delta = Z.delta( data, edit );
                    if ( !this.__atomic__ && delta && !Z.isEmpty( delta ) ) {
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

        // <a class="icon-link" name="state--privileged--method" href="#state--privileged--method"></a>
        // 
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

        // <a class="icon-link"
        //    name="state--privileged--method-names"
        //    href="#state--privileged--method-names"></a>
        // 
        // #### methodNames
        // 
        // Returns an `Array` of names of methods defined for this state.
        methodNames: function ( methods ) {
            return function () {
                return Z.keys( methods );
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--add-method"
        //    href="#state--privileged--add-method"></a>
        // 
        // #### addMethod
        // 
        // Adds a method to this state, which will be callable directly from the owner, but with
        // its context bound to the state.
        // 
        // *See also:* [`State createDelegator`](#state--private--create-delegator)
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

        // <a class="icon-link"
        //    name="state--privileged--remove-method"
        //    href="#state--privileged--remove-method"></a>
        // 
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

        // <a class="icon-link" name="state--privileged--event" href="#state--privileged--event"></a>
        // 
        // #### event
        // 
        // Returns a registered event listener, or the number of listeners registered, for a given
        // event `type`.
        // 
        // If an `id` as returned by [`addEvent`](#state--privileged--add-event) is provided, the
        // event listener associated with that `id` is returned. If no `id` is provided, the number
        // of event listeners registered to `type` is returned.
        event: function ( events ) {
            return function (
                        /*String*/ eventType,
             /*String | Function*/ id
            ) {
                var collection = events[ eventType ];

                if ( collection == null ) return;
                if ( id === undefined ) return collection.length;

                typeof id === 'function' && ( id = collection.key( id ) );
                return collection.get( id );
            };
        },

        // <a class="icon-link" name="state--privileged--add-event" href="#state--privileged--add-event"></a>
        // 
        // #### addEvent
        // 
        // Binds an event listener to the specified `eventType` and returns a unique identifier
        // for the listener. Built-in event types are listed at `STATE_EVENT_TYPES`.
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

        // <a class="icon-link"
        //    name="state--privileged--remove-event"
        //    href="#state--privileged--remove-event"></a>
        // 
        // #### removeEvent
        // 
        // Unbinds the event listener with the specified `id` that was supplied by
        // [`addEvent`](#state--privileged--add-event).
        // 
        // *Aliases:* **off**, **unbind**
        removeEvent: function ( events ) {
            return function ( /*String*/ eventType, /*String*/ id ) {
                return events[ eventType ].remove( id );
            };
        },

        // <a class="icon-link" name="state--privileged--emit" href="#state--privileged--emit"></a>
        // 
        // #### emit
        // 
        // Invokes all listeners bound to the given event type.
        //
        // Arguments for the listeners can be passed as an array to the `args` parameter.
        // 
        // Callbacks are invoked in the context of `this`, or as specified by `context`.
        // 
        // Callbacks bound to superstates and protostates are also invoked, unless otherwise
        // directed by setting `viaSuper` or `viaProto` to `false`.
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

        // <a class="icon-link" name="state--privileged--guard" href="#state--privileged--guard"></a>
        // 
        // #### guard
        // 
        // Gets a **guard** entity for this state. A guard is a value or function that will be
        // evaluated, as either a boolean or predicate, respectively, to provide a determination
        // of whether a controller will be admitted into or released from the state to which the
        // guard is applied. Guards are inherited from protostates, but not from superstates.
        // 
        // *See also:* [`StateController evaluateGuard`](#state-controller--private--evaluate-guard)
        guard: function ( guards ) {
            return function ( /*String*/ guardType ) {
                var guard, protostate;

                return (
                    ( guard = guards[ guardType ] ) && Z.clone( guard )
                        ||
                    ( protostate = this.protostate() ) && protostate.guard( guardType )
                        ||
                    undefined
                );
            };
        },

        // <a class="icon-link" name="state--privileged--add-guard" href="#state--privileged--add-guard"></a>
        // 
        // #### addGuard
        // 
        // Adds a guard to this state, or augments an existing guard with additional entries.
        addGuard: function ( guards ) {
            return function ( /*String*/ guardType, /*Object*/ guard ) {
                return Z.edit( guards[ guardType ] || ( guards[ guardType ] = {} ), guard );
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--remove-guard"
        //    href="#state--privileged--remove-guard"></a>
        // 
        // #### removeGuard
        // 
        // Removes a guard from this state, or removes specific entries from an existing guard.
        removeGuard: function ( guards ) {
            return function (
                        /*String*/ guardType
                /*Array | String*/ /* keys... */
            ) {
                var guard, keys, i, l, key, entry;

                guard = guards[ guardType ];
                if ( !guard ) return null;

                if ( arguments.length < 2 ) return delete guards[ guardType ] ? guard : undefined;

                keys = Z.flatten( Z.slice.call( arguments, 1 ) );
                for ( i = 0, l = keys.length; i < l; i++ ) {
                    key = keys[i];
                    if ( typeof key === 'string' && delete( entry = guard[ key ] ) ) return entry;
                }
            };
        },

        // <a class="icon-link" name="state--privileged--substate" href="#state--privileged--substate"></a>
        // 
        // #### substate
        // 
        // Retrieves the named substate of `this` state. If no such substate exists in the local
        // state, any identically named substate held on a protostate will be returned.
        substate: function ( substates ) {
            return function (
                 /*String*/ stateName,
                /*Boolean*/ viaProto    // = true
            ) {
                var s = this.current(),
                    ss, protostate;

                viaProto === undefined && ( viaProto = true );

                // First scan for any virtual substates that are active on the local controller.
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

        // <a class="icon-link" name="state--privileged--substates" href="#state--privileged--substates"></a>
        // 
        // #### substates
        // 
        // Returns an `Array` of this state’s substates. If the boolean `deep` argument is `true`,
        // returns a depth-first flattened array containing all of this state’s descendant states.
        substates: function ( substates ) {
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
                        while ( s && s !== this && s.isVirtual() && ( ss = s.superstate() ) ) {
                            deep ? result.unshift( s ) : ss === this && result.unshift( s );
                            s = ss;
                        }
                    }
                }

                // Include real substates.
                for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
                    result.push( substates[ key ] );
                    deep && ( result = result.concat( substates[ key ].substates( true ) ) );
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
        // Creates a state from the supplied `stateExpression` and adds it as a substate of
        // this state. If a substate with the same `stateName` already exists, it is first
        // destroyed and then replaced. If the new substate is being added to the controller’s
        // root state, a reference is added directly on the controller itself as well.
        addSubstate: function ( attributes, substates ) {
            return function (
                /*String*/ stateName,
                /*StateExpression | Object | State*/ stateExpression
            ) {
                var substate, controller;

                if ( ~attributes & SA.MUTABLE ) {
                    "catch!";
                }
                if ( stateExpression instanceof State &&
                     stateExpression.isVirtual() &&
                     stateExpression.superstate() === this &&
                     stateExpression.protostate().superstate().isProtostateOf( this )
                ) {
                    "catch!";
                }

                if ( attributes & SA.VIRTUAL ) {
                    return this.realize().addSubstate( stateName, stateExpression );
                }
                if ( attributes & SA.SEALED ) return null;

                ( substate = substates[ stateName ] ) && substate.destroy();

                substate = stateExpression instanceof State ?
                    stateExpression.superstate() === this && stateExpression.realize() :
                    new State( this, stateName, stateExpression );

                if ( !substate ) return null;

                this[ stateName ] = substates[ stateName ] = substate;

                controller = this.controller();
                controller.root() === this && ( controller[ stateName ] = substate );

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

        // <a class="icon-link"
        //    name="state--privileged--transition"
        //    href="#state--privileged--transition"></a>
        // 
        // #### transition
        // 
        // Returns the named transition expression held on this state.
        transition: function ( transitions ) {
            return function ( /*String*/ transitionName ) {
                return transitions[ transitionName ];
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--transitions"
        //    href="#state--privileged--transitions"></a>
        // 
        // #### transitions
        // 
        // Returns an object containing all of the transition expressions defined on this state.
        transitions: function ( transitions ) {
            return function () {
                return Z.clone( transitions );
            };
        },

        // <a class="icon-link"
        //    name="state--privileged--add-transition"
        //    href="#state--privileged--add-transition"></a>
        // 
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

        removeTransition: Z.noop,

        // <a class="icon-link" name="state--privileged--history" href="#state--privileged--history"></a>
        // 
        // #### history
        // 
        history: function ( history ) {
            return function ( indexDelta ) {
                if ( indexDelta === undefined ) return history.express();
                return history[ history.index + indexDelta ];
            };
        },

        // <a class="icon-link" name="state--privileged--push" href="#state--privileged--push"></a>
        // 
        // #### push
        // 
        push: function ( history ) {
            return function ( item ) {
                var state, mutation, superstate;

                item === 'string' && ( item = this.query( item, true, false ) );
                if ( item instanceof State && item.isIn( this ) ) {
                    history.pushState( state = item );
                } else if ( Z.isPlainObject( item ) ) {
                    history.pushMutation( mutation = item );
                }

                // While the history-keeping state is inactive, a state-`push` should not be
                // propagated to any history-keeping superstates, whereas a mutation-`push` should
                // be propagated whether active or inactive.
                if ( state && this.isActive() || mutation ) {
                    superstate = this.superstate();
                    superstate && ( superstate = superstate.historian() );
                    superstate && superstate.push( item );
                }
            };
        },

        old_push: function ( history ) {
            return function ( flags, state, transition, data ) {
                var i, previous, current, superstate;

                typeof flags === 'string' ||
                    ( data = transition, transition = state, state = flags, flags = undefined );

                if ( !( state instanceof State && this.has( state ) ) ) return;

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

                1 || state.isCurrent() || this.goTo( state );

                return history.length;
            };
        },

        // <a class="icon-link" name="state--privileged--replace" href="#state--privileged--replace"></a>
        // 
        // #### replace
        // 
        replace: function ( history ) {
            return function () {
                item === 'string' && ( item = this.query( item ) );
                if ( !item ) return;
                if ( item instanceof State ) return history.replaceState( item );
                if ( Z.isPlainObject( item ) ) return history.replaceMutation( item );
            };
        },

        old_replace: function ( history ) {
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
                    previous && Z.edit( true, previous.data, delta );
                    next && Z.edit( true, next.data, delta );
                }
                current.data = Z.clone( data );

                0 && this.goTo( state );

                return this;
            };
        },

        // <a class="icon-link" name="state--privileged--destroy" href="#state--privileged--destroy"></a>
        // 
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

                // Descendant states are destroyed bottom-up.
                for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
                    substates[ stateName ].destroy();
                }

                // `destroy` is the final event emitted.
                this.emit( 'destroy', false );
                for ( key in events ) {
                    events[ key ].destroy();
                    delete events[ key ];
                }

                // The state must remove itself from its superstate.
                if ( superstate ) {

                    // A mutable superstate has a `removeSubstate` method already available.
                    if ( superstate.isMutable() ) superstate.removeSubstate( this.name() );

                    // An immutable superstate must be peeked to acquire a `removeSubstate` method.
                    else {
                        privileged.removeSubstate(
                            superstate.peek( __MODULE__, 'attributes' ),
                            superstate.peek( __MODULE__, 'substates' )
                        ).call( superstate, this.name() );
                    }
                }

                // When the root state is destroyed, the owner gets back its original methods, and
                // the corresponding delegator for each such method is destroyed.
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

                    // The `destroy` call is propagated to the root’s controller, unless it was
                    // controller itself that instigated the call.
                    controller.destroy && controller.destroy();
                }

                setSuperstate( undefined );

                // A flag is set that can be observed later by anything retaining a reference to
                // this state (e.g. a memoization) which would be withholding it from being
                // garbage-collected. A well-behaved retaining entity should check this flag as
                // necessary to reassert the validity of its reference, and discard the reference
                // after it observes `destroyed` to have been set to `true`.
                return this.destroyed = true;
            };
        }
    };

    // <a class="icon-link" name="state--prototype" href="#state--prototype"></a>
    // 
    // ### Prototype methods
    // 
    // The instance methods defined above are also defined here, either as no-ops or defaults, so
    // as to provide virtual states with a conformant [`State`](#state) interface despite not (or
    // not yet) having been realized.
    Z.privilege( State.prototype, privileged, {
        'data method substate substates' : [ null ]
    });
    Z.assign( State.prototype, {
        attributes: Z.thunk( SA.NORMAL ),
        isVirtual:    function () { return !!( this.attributes() & SA.VIRTUAL ); },
        isMutable:    function () { return !!( this.attributes() & SA.MUTABLE ); },
        isFinite:     function () { return !!( this.attributes() & SA.FINITE ); },
        isImmutable:  function () { return !!( this.attributes() & SA.IMMUTABLE ); },
        isInitial:    function () { return !!( this.attributes() & SA.INITIAL ); },
        isConclusive: function () { return !!( this.attributes() & SA.CONCLUSIVE ); },
        isFinal:      function () { return !!( this.attributes() & SA.FINAL ); },
        isAbstract:   function () { return !!( this.attributes() & SA.ABSTRACT ); },
        isDefault:    function () { return !!( this.attributes() & SA.DEFAULT ); },
        isSealed:     function () { return !!( this.attributes() & SA.SEALED ); },
        isRetained:   function () { return !!( this.attributes() & SA.RETAINED ); },
        hasHistory:   function () { return !!( this.attributes() & SA.HISTORY ); },
        isShallow:    function () { return !!( this.attributes() & SA.SHALLOW ); },
        isVersioned:  function () { return !!( this.attributes() & SA.VERSIONED ); },
        isConcurrent: function () { return !!( this.attributes() & SA.CONCURRENT ); },

        'name \
         peek \
         express mutate \
         superstate \
         addMethod removeMethod \
         event addEvent removeEvent emit trigger \
         guard addGuard removeGuard \
         addSubstate removeSubstate \
         transition addTransition removeTransition' :
            Z.noop,

        realize: Z.getThis,
        methodNames: function () { return []; },
        transitions: function () { return {}; },
        destroy: Z.thunk( false ),

        // <a class="icon-link"
        //    name="state--prototype--mutate"
        //    href="#state--prototype--mutate"></a>
        // 
        // #### mutate
        // 
        // By default states are weakly immutable and their contents cannot be changed. However,
        // a weak-immutable superstate may contain a mutable substate, to which the corresponding
        // part of a mutation operation can be forwarded.
        mutate: function ( expr ) {
            var name, value,
                NIL = Z.NIL,
                substates = this.substates(),
                collection = expr.states;

            for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                value = collection[ name ];
                if ( name in substates ) {
                    value !== NIL && substates[ name ].mutate( value, false );
                } else {
                    this.addSubstate( name, value );
                }
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
        },

        // <a class="icon-link"
        //    name="state--prototype--controller"
        //    href="#state--prototype--controller"></a>
        // 
        // #### controller
        // 
        // Gets the [`StateController`](#state-controller) to which this state belongs.
        controller: function () {
            var superstate = this.superstate();
            if ( superstate ) return superstate.controller();
        },

        // <a class="icon-link" name="state--prototype--owner" href="#state--prototype--owner"></a>
        // 
        // #### owner
        // 
        // Gets the owner object to which this state’s controller belongs.
        owner: function () {
            var controller = this.controller();
            if ( controller ) return controller.owner();
        },

        // <a class="icon-link" name="state--prototype--root" href="#state--prototype--root"></a>
        // 
        // #### root
        // 
        // Gets the root state, i.e. the top-level superstate of this state.
        root: function () {
            var controller = this.controller();
            if ( controller ) return controller.root();
        },

        // <a class="icon-link"
        //    name="state--prototype--current"
        //    href="#state--prototype--current"></a>
        // 
        // #### current
        // 
        // Gets the local controller’s current state.
        current: function () {
            var controller = this.controller();
            if ( controller ) return this.controller().current();
        },

        // <a class="icon-link"
        //    name="state--prototype--default-substate"
        //    href="#state--prototype--default-substate"></a>
        // 
        // #### defaultSubstate
        // 
        // Returns the first substate marked `default`, or simply the first substate. Recursion
        // continues into the protostate only if no local descendant states are marked `initial`.
        defaultSubstate: function (
            /*Boolean*/ viaProto, // = true
                           first
        ) {
            var substates = this.substates(),
                i = 0, l = substates && substates.length,
                protostate;

            first || l && ( first = substates[0] );
            for ( ; i < l; i++ ) if ( substates[i].isDefault() ) return substates[i];

            if ( ( viaProto || viaProto === undefined ) && ( protostate = this.protostate() ) ) {
                return protostate.defaultSubstate( true, first );
            }

            return first;
        },

        // <a class="icon-link"
        //    name="state--prototype--initial-substate"
        //    href="#state--prototype--initial-substate"></a>
        // 
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
                substates = subject.substates( false, true );
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

        // <a class="icon-link"
        //    name="state--prototype--protostate"
        //    href="#state--prototype--protostate"></a>
        // 
        // #### protostate
        // 
        // Returns the **protostate**, the state analogous to `this` found in the next object in
        // the owner’s prototype chain that has one. A state inherits first from its protostates,
        // then from its superstates.
        // 
        // If the owner does not share an analogous [`StateController`](#state-controller) with its
        // prototype, or if no protostate can be found in the hierarchy of the prototype’s state
        // controller, then the search is iterated up the prototype chain.
        // 
        // A state and its protostate will always share an identical name and identical derivation
        // pattern, as will the respective superstates of both, relative to one another.
        protostate: function () {
            var derivation = this.derivation( true ),
                controller = this.controller(),
                controllerName, prototype, next, protostate, i, l;

            if ( !controller ) return;

            controllerName = controller.name();
            prototype = controller.owner();

            // Returns the root state of the next `prototype` in the chain.
            next = function () {
                var fn, s;
                prototype = Z.getPrototypeOf( prototype );
                return (
                    prototype &&
                    typeof prototype === 'object' &&
                    Z.isFunction( fn = prototype[ controllerName ] ) &&
                    ( s = fn.apply( prototype ) ) &&
                    s instanceof State &&
                    s.root()
                );
            };

            // Walk up the prototype chain; starting at each prototype’s root state, locate the
            // protostate that corresponds to `this`.
            for ( protostate = next(); protostate; protostate = next() ) {
                for ( i = 0, l = derivation.length; i < l; i++ ) {
                    protostate = protostate.substate( derivation[i], false );
                    if ( !protostate ) break;
                }

                if ( protostate ) {
                    // Before returning the located protostate, memoize subsequent lookups with
                    // an instance method that closes over it.
                    if ( meta.options.memoizeProtostates ) {
                        this.protostate = function () {
                            if ( protostate.destroyed ) {
                                // If `destroyed` has been set, it means we’re hanging onto an
                                // invalid reference, so clear it for GC, and relay this invocation
                                // back up to
                                // [`State.prototype.protostate`](#state--prototype--protostate).
                                protostate = null;
                                delete this.protostate;
                                return this.protostate();
                            }
                            else return protostate;
                        };
                    }

                    return protostate;
                }
            }
        },

        // <a class="icon-link"
        //    name="state--prototype--derivation"
        //    href="#state--prototype--derivation"></a>
        // 
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

        // <a class="icon-link"
        //    name="state--prototype--depth"
        //    href="#state--prototype--depth"></a>
        // 
        // #### depth
        // 
        // Returns the number of superstates this state has. The root state returns `0`, its
        // immediate substates return `1`, etc.
        depth: function () {
            for ( var n = 0, s = this, ss; ss = s.superstate(); s = ss, n++ );
            return n;
        },

        // <a class="icon-link"
        //    name="state--prototype--common"
        //    href="#state--prototype--common"></a>
        // 
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

        // <a class="icon-link" name="state--prototype--is" href="#state--prototype--is"></a>
        // 
        // #### is
        // 
        // Determines whether `this` is `state`.
        is: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this;
        },

        // <a class="icon-link" name="state--prototype--is-in" href="#state--prototype--is-in"></a>
        // 
        // #### isIn
        // 
        // Determines whether `this` is or is a substate of `state`.
        isIn: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this || state.isSuperstateOf( this );
        },

        // <a class="icon-link" name="state--prototype--has" href="#state--prototype--has"></a>
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
        //    name="state--prototype--is-protostate-of"
        //    href="#state--prototype--is-protostate-of"></a>
        // 
        // #### isProtostateOf
        // 
        // Determines whether `this` is a state analogous to `state` on any object in the
        // prototype chain of `state`’s owner.
        isProtostateOf: function ( /*State | String*/ state ) {
            var protostate;
            state instanceof State || ( state = this.query( state ) );

            return ( protostate = state.protostate() ) ?
                this === protostate || this.isProtostateOf( protostate ) :
                false;
        },

        // <a class="icon-link"
        //    name="state--prototype--apply"
        //    href="#state--prototype--apply"></a>
        // 
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

            if ( !method ) return this.emit( 'nonexistent', [ methodName, args ], false );

            context = out.context;
            owner = this.owner();
            ownerMethod = owner[ methodName ];
            if ( ownerMethod && ownerMethod.original && context === this.root() ) {
                context = owner;
            }

            return method.apply( context, args );
        },

        // <a class="icon-link" name="state--prototype--call" href="#state--prototype--call"></a>
        // 
        // #### call
        // 
        // Variadic [`apply`](#state--prototype--apply).
        call: function ( /*String*/ methodName ) {
            return this.apply( methodName, Z.slice.call( arguments, 1 ) );
        },

        // <a class="icon-link"
        //    name="state--prototype--has-method"
        //    href="#state--prototype--has-method"></a>
        // 
        // #### hasMethod
        // 
        // Determines whether `this` possesses or inherits a method named `methodName`.
        hasMethod: function ( /*String*/ methodName ) {
            var method = this.method( methodName );
            return method && method !== Z.noop;
        },

        // <a class="icon-link"
        //    name="state--prototype--has-own-method"
        //    href="#state--prototype--has-own-method"></a>
        // 
        // #### hasOwnMethod
        // 
        // Determines whether `this` directly possesses a method named `methodName`.
        hasOwnMethod: function ( /*String*/ methodName ) {
            return !!this.method( methodName, false, false );
        },

        // <a class="icon-link"
        //    name="state--prototype--change"
        //    href="#state--prototype--change"></a>
        // 
        // #### change
        // 
        // Forwards a `change` command to the state’s controller and returns its result.
        // Calling with no arguments directs the controller to change to `this` state.
        // 
        // *Aliases:* **go**, **be**
        //
        // *See also:* [`StateController.privileged.change`](#state-controller--privileged--change)
        'change go be': function (
            /*State | String*/ target,  // optional
                    /*Object*/ options  // optional
        ) {
            var controller = this.controller();

            if ( !arguments.length ) return controller.change( this );

            Z.isNumber( target ) && ( target = this.history( target ) );
            return controller.change.apply( controller,
                target instanceof State || typeof target === 'string' ?
                    arguments :
                    [ this ].concat( arguments )
            );
        },

        // <a class="icon-link"
        //    name="state--prototype--change-to"
        //    href="#state--prototype--change-to"></a>
        // 
        // #### changeTo
        // 
        // Calls `change` without regard to a `target`’s retained internal state.
        // 
        // *Aliases:* **goTo**, **become**
        // 
        // *See also:* [`State.prototype.change`](#state--prototype--change)
        'changeTo goTo become': function (
            /*State | String*/ target,
                    /*Object*/ options  // optional
        ) {
            target === undefined && ( target = this );
            options ? ( options.direct = true ) : ( options = { direct: true } );
            return this.change( target, options );
        },

        // <a class="icon-link"
        //    name="state--prototype--is-current"
        //    href="#state--prototype--is-current"></a>
        // 
        // #### isCurrent
        // 
        // Returns a `Boolean` indicating whether `this` is the controller’s current state.
        isCurrent: function () {
            return this.current() === this;
        },

        // <a class="icon-link"
        //    name="state--prototype--is-active"
        //    href="#state--prototype--is-active"></a>
        // 
        // #### isActive
        // 
        // Returns a `Boolean` indicating whether `this` or one of its substates is the
        // controller’s current state.
        isActive: function () {
            var current = this.current();
            return current === this || this.isSuperstateOf( current );
        },

        // <a class="icon-link"
        //    name="state--prototype--history"
        //    href="#state--prototype--history"></a>
        // 
        // #### history
        // 
        history: function () {
            var h = this.historian();
            if ( h ) return h.history();
        },

        // <a class="icon-link"
        //    name="state--prototype--historian"
        //    href="#state--prototype--historian"></a>
        // 
        // #### historian
        // 
        // Returns `this` if it records a history, or else the nearest superstate that records a
        // deep history.
        historian: function () {
            if ( this.hasHistory() ) return this;
            for ( var s = this.superstate(); s; s = s.superstate() ) {
                if ( s.hasHistory() && !s.isShallow() ) return s;
            }
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

        // <a class="icon-link" name="state--prototype--query" href="#state--prototype--query"></a>
        // 
        // #### query
        // 
        // Matches a `selector` string with the state or states it represents, evaluated first in
        // the context of `this`, then its substates, and then its superstates, until all
        // locations in the state tree have been searched for a match of `selector`.
        // 
        // Returns the matched [`State`](#state), or an `Array` containing the set of matched
        // states. If a state to be tested `against` is provided, a `Boolean` is returned,
        // indicating whether `against` is the matched state or is included in the matching set.
        // 
        // Setting `descend` to `false` disables recursion through the substates of `this`, and
        // likewise setting `ascend` to `false` disables the subsequent recursion through its
        // superstates.
        // 
        // *Alias:* **match**
        'query match': function (
             /*String*/ selector,
              /*State*/ against, // optional
            /*Boolean*/ descend, // = true
            /*Boolean*/ ascend,  // = true
            /*Boolean*/ viaProto // = true
        ) {
            var parts, cursor, next, result, i, l, name,
                queue, subject, substates, state, superstate, protostate;

            if ( typeof against === 'boolean' ) {
                ascend = descend, descend = against, against = undefined;
            }
            descend === undefined && ( descend = true );
            ascend === undefined && ( ascend = true );
            viaProto === undefined && ( viaProto = true );

            // A few exceptional cases may be resolved early.
            if ( selector == null ) return against !== undefined ? false : null;
            if ( selector === '.' ) return against !== undefined ? against === this : this;
            if ( selector === '' ) {
                return against !== undefined ? against === this.root() : this.root();
            }

            // Absolute wildcard expressions compared against the root state pass immediately.
            if ( against && against === this.root() && selector.search(/^\*+$/) === 0 ) {
                return true;
            }

            // Pure `.`/`*` expressions should not be recursed.
            selector.search(/^\.*\**$/) === 0 && ( descend = ascend = false );

            // If `selector` is an absolute path, evaluate it from the root state as a relative
            // path.
            if ( selector.charAt(0) !== '.' ) {
                return this.root().query( '.' + selector, against, descend, false );
            }

            // An all-`.` `selector` must have one `.` trimmed to parse correctly.
            selector = selector.replace( /^(\.+)\.$/, '$1' );

            // Split `selector` into tokens, consume the leading empty-string straight away, then
            // parse the remaining tokens. A `cursor` reference to a matching [`State`](#state) in
            // the tree is kept, beginning with the context state (`this`), and updated as each
            // token is consumed.
            parts = selector.split('.');
            for ( i = 1, l = parts.length, cursor = this; cursor; i++ ) {

                // Upon reaching the end of the token stream, return the [`State`](#state)
                // currently referenced by `cursor`.
                if ( i >= l ) return against ? against === cursor : cursor;

                // Consume a token.
                name = parts[i];

                // Interpret a **single wildcard** as any *immediate* substate of the `cursor`
                // state parsed thus far.
                if ( name === '*' ) {
                    if ( !against ) return cursor.substates();
                    else if ( cursor === against.superstate() ) return true;
                    else break;
                }

                // Interpret a **double wildcard** as any descendant state of the `cursor` state
                // parsed thus far.
                else if ( name === '**' ) {
                    if ( !against ) return cursor.substates( true );
                    else if ( cursor.isSuperstateOf( against ) ) return true;
                    else break;
                }

                // Empty string, the product of leading/consecutive dots, implies `cursor`’s
                // superstate.
                else if ( name === '' ) {
                    cursor = cursor.superstate();
                }

                // Interpret any other token as an identifier that names a specific substate of
                // `cursor`.
                else if ( next = cursor.substate( name ) ) {
                    cursor = next;
                }

                // If no matching substate exists, the query fails for this context.
                else break;
            }

            // If the query has failed, then recursively descend the tree, breadth-first, and
            // retry the query with a different context.
            if ( descend ) {
                queue = [ this ];
                while ( subject = queue.shift() ) {
                    substates = subject.substates( false, true );
                    for ( i = 0, l = substates.length; i < l; i++ ) {
                        state = substates[i];

                        // The `ascend` block uses `descend` to indicate a substate that has
                        // already been searched.
                        if ( state === descend ) continue;

                        result = state.query( selector, against, false, false, false );
                        if ( result ) return result;

                        queue.push( state );
                    }
                }
            }

            // If the query still hasn’t succeeded, then recursively ascend the tree and retry,
            // but also passing `this` as a domain to be skipped during the superstate’s
            // subsequent descent.
            if ( ascend && ( superstate = this.superstate() ) ) {
                result = superstate.query( selector, against, descend && this, true, false );
                if ( result ) return result;
            }

            // If the query still hasn’t succeeded, then retry the query on the protostate.
            if ( viaProto && ( protostate = this.protostate() ) ) {
                result = protostate.query( selector, against, descend, ascend, true );
                if ( result ) return result;
            }

            // All possibilities exhausted; no matches exist.
            return against ? false : null;
        },

        // <a class="icon-link" name="state--prototype--$" href="#state--prototype--$"></a>
        // 
        // #### $
        // 
        // Convenience method that either aliases to [`change`](#state--prototype--change) if
        // passed a function for the first argument, or aliases to
        // [`query`](#state--prototype--query) if passed a string — thereby mimicking the behavior
        // of the object’s accessor method.
        // 
        // *See also:*
        // [`StateController createAccessor`](#state-controller--private--create-accessor)
        $: function ( expr ) {
            var args;
            if ( typeof expr === 'function' ) {
                args = Z.slice.call( arguments );
                args[0] = expr = expr();
                if ( expr ) return this.change.apply( this, args );
            }
            else return this.query.apply( this, arguments );
        }
    });
    Z.alias( State.prototype, { addEvent: 'on bind', removeEvent: 'off unbind' } );

    return State;
})();


// ## StateExpression <a class="icon-link" name="state-expression" href="#state-expression"></a>
// 
// A **state expression** formalizes a definition of a state’s contents. States are declared by
// calling the module’s exported [`state()`](#module) function and passing it an object map
// containing the definition. This input may be expressed in a shorthand format, which the
// [`StateExpression`](#state-expression) [constructor](#state-expression--constructor) rewrites
// into unambiguous long form, which can be used later to create [`State`](#state) instances.

var StateExpression = ( function () {
    var attributeMap   = Z.forEach( Z.assign( STATE_ATTRIBUTE_MODIFIERS ),
            function ( value, key, object ) { object[ key ] = key.toUpperCase(); }),
        attributeFlags = Z.forEach( Z.invert( STATE_ATTRIBUTES ),
            function ( value, key, object ) { object[ key ] = value.toLowerCase(); }),
        categoryMap    = Z.assign( STATE_EXPRESSION_CATEGORIES ),
        eventTypes     = Z.assign( STATE_EVENT_TYPES ),
        guardActions   = Z.assign( GUARD_ACTIONS );

    // <a class="icon-link"
    //    name="state-expression--constructor"
    //    href="#state-expression--constructor"></a>
    // 
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

        Z.edit( 'deep all', this, map instanceof StateExpression ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            Z.isNumber( attributes ) || ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // <a class="icon-link"
    //    name="state-expression--class"
    //    href="#state-expression--class"></a>
    // 
    // ### Class functions

    // <a class="icon-link"
    //    name="state-expression--class--encode-attributes"
    //    href="#state-expression--class--encode-attributes"></a>
    // 
    // #### encodeAttributes
    // 
    // Returns the bit-field integer represented by the provided set of attributes.
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
    StateExpression.encodeAttributes = encodeAttributes;

    // <a class="icon-link"
    //    name="state-expression--class--decode-attributes"
    //    href="#state-expression--class--decode-attributes"></a>
    // 
    // #### decodeAttributes
    // 
    // Returns the space-delimited set of attribute names represented by the provided bit-field
    // integer.
    function decodeAttributes ( /*Number*/ attributes ) {
        var key, out = [];
        for ( key in attributeFlags ) attributes & key && out.push( attributeFlags[ key ] );
        return out.join(' ');
    }
    StateExpression.decodeAttributes = decodeAttributes;

    // <a class="icon-link"
    //    name="state-expression--private"
    //    href="#state-expression--private"></a>
    // 
    // ### Class-private functions

    // <a class="icon-link"
    //    name="state-expression--private--interpret"
    //    href="#state-expression--private--interpret"></a>
    // 
    // #### interpret
    // 
    // Transforms a plain object map into a well-formed [`StateExpression`](#state-expression),
    // making the appropriate inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category,
            result = Z.assign( STATE_EXPRESSION_CATEGORIES, null );

        // Interpret and categorize the elements of the provided `map`.
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
            else if ( key in result && value ) {
                result[ key ] = Z.edit( 'deep all', result[ key ], value );
            }

            // **Priority 3:** Use keys and value types to infer implicit categorization.
            else {
                category =
                    key in eventTypes || typeof value === 'string' ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isPlainObject( value ) ? 'states' :
                    Z.isFunction( value ) ? 'methods' :
                    undefined;
                if ( category ) {
                    ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
                }
            }
        }

        // Coerce the extracted values as necessary.

        // Event values are coerced into an array.
        object = result.events;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( typeof value === 'function' || typeof value === 'string' ) {
                object[ key ] = [ value ];
            }
        }

        // Guards are represented as a hashmap keyed by selector, so non-object values are coerced
        // into a single-element object with the value keyed to the wildcard selector.
        object = result.guards;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !Z.isPlainObject( value ) ) {
                object[ key ] = { '*': value };
            }
        }

        // Transition values must be a [`TransitionExpression`](#transition-expression).
        object = result.transitions;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof TransitionExpression ||
                ( object[ key ] = new TransitionExpression( value ) );
        }

        // State values must be a [`StateExpression`](#state-expression).
        object = result.states;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof StateExpression ||
                ( object[ key ] = new StateExpression( value ) );
        }

        return result;
    }

    return StateExpression;
})();


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
            // *See* [`StateController.privileged.change`](#state-controller--privileged--change)
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
        // guards supplied in both the origin and `target` states.
        // 
        // The `target` parameter may be either a [`State`](#state) object within the purview of
        // this controller, or a string that resolves to a likewise targetable `State` when
        // evaluated from the context of the most recently current state.
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
                    target; // TODO: Interpret number-typed `target` as a history traversal. 
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
                    state = target.history( 0 );
                    target = state != null && target.query( state ) || target;
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
                source = this.current();

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

// ## StateEventCollection <a class="icon-link" name="state-event-collection" href="#state-event-collection"></a>
// 
// A state holds event listeners for each of its various event types in a `StateEventCollection`
// instance.
// 
// An event listener is usually a function, but may also be held as a string, which, when the client
// state [`emit`](#state-event-collection--prototype--event)s the event type associated with this
// collection, will be interpreted as an implicit order for the emitting state to
// [`change`](#state--prototype--change) to the target state named by the string.
var StateEventCollection = ( function () {
    var guid = 0;

    // <a class="icon-link" name="state-event-collection" href="#state-event-collection"></a>
    // 
    // ### Constructor
    function StateEventCollection ( state, type ) {
        this.state = state;
        this.type = type;
        this.items = {};
        this.length = 0;
    }

    // <a class="icon-link"
    //    name="state-event-collection--prototype"
    //    href="#state-event-collection--prototype"></a>
    // 
    // ### Prototype methods
    Z.assign( StateEventCollection.prototype, {

        // <a class="icon-link"
        //    name="state-event-collection--prototype--guid"
        //    href="#state-event-collection--prototype--guid"></a>
        // 
        // #### guid
        // 
        // Produces a unique numeric string, to be used as a key for bound event listeners.
        guid: function () {
            return ( guid += 1 ).toString();
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--get"
        //    href="#state-event-collection--prototype--get"></a>
        // 
        // #### get
        // 
        // Retrieves a bound listener associated with the provided `id` string as returned by
        // the prior call to [`add`](#state-event-collection--prototype--add).
        get: function ( /*String*/ id ) {
            return this.items[ id ];
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--get-all"
        //    href="#state-event-collection--prototype--get-all"></a>
        // 
        // #### getAll
        // 
        // Returns an array of all bound listeners.
        getAll: function () {
            var i, items = this.items, result = [];
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) result.push( items[i] );
            return result;
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--set"
        //    href="#state-event-collection--prototype--set"></a>
        // 
        // #### set
        // 
        // Adds or replaces a handler bound to a specific key.
        set: function (
                       /*String*/ id,
            /*Function | String*/ handler
        ) {
            var items = this.items;
            Z.hasOwn.call( items, id ) || this.length++;
            items[ id ] = handler;
            return id;
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--key"
        //    href="#state-event-collection--prototype--key"></a>
        // 
        // #### key
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( /*Function*/ listener ) {
            var i, items = this.items;
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) {
                if ( items[i] === listener ) return i;
            }
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--keys"
        //    href="#state-event-collection--prototype--keys"></a>
        // 
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

        // <a class="icon-link"
        //    name="state-event-collection--prototype--add"
        //    href="#state-event-collection--prototype--add"></a>
        // 
        // #### add
        // 
        // Binds a listener, along with an optional context object, to be called when the
        // the collection [`emit`](#state-event-collection--prototype--emit)s an event. Returns a
        // unique key that can be used later to
        // [`remove`](#state-event-collection--prototype--remove) the listener.
        // 
        // *Aliases:* **on bind**
        'add on bind': function (
            /*Function*/ fn,
              /*Object*/ context  // optional
        ) {
            var id = this.guid();
            this.items[ id ] = typeof context === 'object' ? [ fn, context ] : fn;
            this.length++;
            return id;
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--remove"
        //    href="#state-event-collection--prototype--remove"></a>
        // 
        // #### remove
        // 
        // Unbinds a listener. Accepts either the numeric string returned by
        // [`add`](#state-event-collection--prototype--add) or a reference to the function itself.
        // 
        // *Aliases:* **off unbind**
        'remove off unbind': function ( /*Function | String*/ id ) {
            var fn, i, l,
                items = this.items;

            fn = items[ typeof id === 'function' ? this.key( id ) : id ];
            if ( !fn ) return false;
            delete items[ id ];
            this.length--;
            return fn;
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--empty"
        //    href="#state-event-collection--prototype--empty"></a>
        // 
        // #### empty
        // 
        // Removes all listeners, and returns the number of listeners removed.
        empty: function () {
            var n = this.length, items, i;

            if ( n === 0 ) return 0;

            items = this.items;
            for ( i in items ) if ( Z.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return n;
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--emit"
        //    href="#state-event-collection--prototype--emit"></a>
        // 
        // #### emit
        // 
        // Invokes all bound listeners, with the provided array of `args`, and in the context of
        // the bound or provided `state`.
        // 
        // *Alias:* **trigger**
        'emit trigger': function ( args, state ) {
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

                // If `item` is a string or [`State`](#state), interpret this as an implied
                // transition to be instigated from the client `State` after all the callbacks
                // have been invoked.
                else if ( itemType === 'string' || item instanceof State ) {
                    target = item;
                    continue;
                }

                fn.apply( context, args );
                fn = context = null;
            }

            target && state.change( target );
        },

        // <a class="icon-link"
        //    name="state-event-collection--prototype--destroy"
        //    href="#state-event-collection--prototype--destroy"></a>
        // 
        // #### destroy
        // 
        destroy: function () {
            this.empty();
            delete this.state, delete this.items;
            return true;
        }
    });

    return StateEventCollection;
})();


// ## StateHistory
// 
/*
    ' * ' : the precise location within the `history` array that describes the
            present condition and composition of `this.state`
    'Sta' : any string that names a state
    'Mut' : any delta object that describes a mutation
    'NIL' : the value `Z.NIL`
    '~==' : "is essentially deep-equal to"
    '<ƒ>' : an arbitrary function
    
                                                        7         *    11
    history            : [ Sta Sta Mut Sta Mut Mut Sta Sta Mut Mut Mut Sta Mut Sta ]
    historyIndex       : 7
    stateIndices       : [ 0  1  3  6  7  11  12  14 ]
    stateIndicesIndex  : 4
    mutationOffset     : 2
              7                                           *                   11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:3} }, 'StateB' ... ]
    
    this.state.express() ~== state( 'mutable history', {
                                 data: { a:1 },
                                 methods: { b:<ƒ> },
                                 states: {
                                     StateA: {},
                                     StateB: {}
                                 }
                             })
    
    
    > this.mutate( 1 );
    mutationOffset     : 3
    
              7                                                             *   11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:NIL} }, 'StateB' ... ]
    
    this.state.express() ~== state( ...
                                 data: { a:1, c:3 },
                                 methods: { b:<ƒ> }
                             ... )
    
    
    > this.mutate( -2 );
    mutationOffset     : 1
    
              7                      *                                        11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:<ƒ>} }, { data:{c:3} }, 'StateB' ... ]
    
    this.state.express() ~== state( ...
                                 data: { a:1 },
                                 methods: {}
                             ... )
*/

var StateHistory = ( function () {

    var guid = 0;

    function StateHistory ( /*State*/ state ) {

        // The state to which this history belongs.
        this.state = state;

        // The content of a history is stored as a “heap” of `elements`, whose keys are unique
        // decimal integers supplied by the up-scope `guid`, which map to values that are either:
        // 
        // * a `String` that uniquely identifies a previously or subsequently current `State`
        //   within the domain of `this.state`;
        // 
        // * an `Object` that represents a **mutation delta**, which contains the key-value
        //   changes between adjacent mutations of `this.state`;
        // 
        // * a `Number` that is an **element reference** that points to a superhistory element,
        //   within which is contained the information relevant to this element;
        // 
        // * or `null`, indicating a recorded period of inactivity for `this.state`.
        this.elements = {};

        // The element references of `this.elements` are indexed in an ordered list.
        this.history = [];

        // `this.historyIndex` indirectly references, via `this.history`, a state (string) element
        // within `this.elements` that names the specific `State` that is presently **current**
        // within the history.
        this.historyIndex = undefined;

        // By default a history is “deep”, in that it records a view into the timeline of its
        // client `state`, which includes the active condition of and mutations to all of the
        // state’s descendants. This is contrasted with a `shallow` history, which only records
        // the active condition of the `state`’s immediate substates, and mutations to its own
        // content.
        // 
        // As such the shallow history does not hold reference elements, and does not propagate
        // traversals or `push`es.
        this.shallow = state.isShallow();

        // A host state that bears the `immutable` attribute asserts that all of its descendant
        // states will also be immutable; consequently the history does not need to record
        // mutations or implement the structures and logic required to traverse the recorded
        // mutations.
        // 
        // Absent that guarantee of absolute immutability, mutations will be stored within
        // `this.history` as deltas relative to the present expression of `this.state`. Traversal
        // operations will update these deltas as necessary to reflect the movement of the
        // `historyIndex` pointer.
        if ( !( this.stateIsImmutable = state.isImmutable() ) ) {

            // For faster traversals amidst mutations, `this.stateIndices` holds an array
            // containing the specific indices within `this.history` that point to states. A
            // `stateIndicesIndex` property is added as well, such that, for `history.length > 0`,
            // `this.stateIndices[ this.stateIndicesIndex ]` is equal to `this.historyIndex`.
            this.stateIndices = [];
            this.stateIndicesIndex = undefined;

            // A sequence of mutations is stored as a subarray of interstitial deltas between
            // adjacent state elements. The history’s current state, including mutations undergone
            // since the transition into that state, is precisely defined in relation to
            // `this.historyIndex` by `this.mutationOffset`, which is a non-negative number of
            // deltas ahead of `this.historyIndex`.
            this.mutationOffset = 0;
        }
    }

    Z.assign( StateHistory.prototype, {

        // #### superhistory
        //
        superhistory: function () {
            var superstate = this.state.superstate();
            if ( superstate ) return superstate.historian();
        },

        // #### root
        //
        root: function () {
            var sh = this.superhistory();
            if ( sh ) return sh.root() || sh;
        },

        // #### createElement
        // 
        // type inferences of `item`:
        //   * `Number` : pointer to a history element in a superstate
        //   * `String` : state path
        //   * `Object` : mutation delta
        //   * `null`   : state is inactive
        createElement: function ( item ) {
            this.elements[ guid += 1 ] = item;
        },
        
        // #### indexOf
        //
        // Returns the index of the item within `this.history` that holds the `key` for a
        // particular member of `this.elements`.
        indexOf: ( function () {
            function search ( sortedArray, key, min, max ) {
                var i, k;
                min || ( min = 0 );
                max || ( max = sortedArray.length - 1 );
                while ( min <= max ) {
                    i = ( min + max ) / 2 << 0;
                    k = sortedArray[i];
                    if      ( key < k ) max = i - 1;
                    else if ( key > k ) min = i + 1;
                    else    return i;
                }
            }
            return function ( key ) {
                return search( this.history, key );
            };
        })(),

        // #### traverse
        // 
        // Traverses the history per state, applying any interstitial mutations along the way.
        traverse: function (
             /*Number*/ states,
             /*Number*/ mutations, // = 0
            /*Boolean*/ directly   // = true
        ) {
            typeof mutations === 'boolean' && ( directly = mutations, mutations = 0 );
            mutations == null && ( mutations = 0 );

            var elements, history, historyIndex, historyLength,
            _;
            
        },

        old_traverse: function (
             /*Number*/ states,
             /*Number*/ mutations, // = 0
            /*Boolean*/ directly   // = true
        ) {
            var elements, history, historyIndex, historyLength,
                stateIndices, stateIndicesLength, stateIndicesIndex, mutationOffset,
                targetStateIndicesIndex, targetHistoryIndex,
                step, expr, blockLength, i, delta, deltaSum;

            elements = this.elements;
            history = this.history;
            historyIndex = this.historyIndex;
            if ( historyIndex === undefined ) return;
            historyLength = history.length;

            directly === undefined && ( directly = true );

            // If the host state and all of its descendants are immutable, then it is guaranteed
            // that no mutations will be stored in `history`. This means all of its elements will
            // refer to states, so traversal operations can simply proceed per-element.
            if ( this.stateIsImmutable ) {
                
                // Clamp `n` and acquire a `targetHistoryIndex`.
                targetHistoryIndex = historyIndex + n;
                    if ( targetHistoryIndex >= historyLength ) {
                        targetHistoryIndex = historyLength - 1;
                    } else if ( targetHistoryIndex < 0 ) {
                        targetHistoryIndex = 0;
                    }
                n = targetHistoryIndex - historyIndex;
                step = n < 0 ? -1 : 1;
                
                // `directly` causes the traversal to jump straight to the targeted state and
                // instigate a single transition; otherwise the traversal transitions through
                // each state in order.
                if ( directly ) {
                    this.historyIndex = targetHistoryIndex;
                    this.changeState( history[ targetHistoryIndex ] );
                } else {
                    while ( historyIndex !== targetHistoryIndex ) {
                        this.historyIndex = historyIndex += step;
                        this.changeState( history[ historyIndex ] );
                    }
                }
            }
            
            // Otherwise, since the host state or any of its descendants could be mutable, the
            // possibility exists of mutations being stored in this history, in which case the
            // traversal will involve applying these mutations to the host state and transforming
            // the mutation deltas appropriately.
            else {
                // Clamp `n` and acquire a `targetHistoryIndex`.
                stateIndices             = this.stateIndices;
                stateIndicesLength       = stateIndices.length;
                stateIndicesIndex        = this.stateIndicesIndex;
                mutationOffset           = this.mutationOffset;
                targetStateIndicesIndex  = stateIndicesIndex + n;
                    if ( targetStateIndicesIndex >= stateIndicesLength ) {
                        targetStateIndicesIndex = stateIndicesLength - 1;
                    } else if ( targetStateIndicesIndex < 0 ) {
                        targetStateIndicesIndex = 0;
                    }
                targetHistoryIndex       = stateIndices[ targetStateIndicesIndex ];
                n                        = targetStateIndicesIndex - stateIndicesIndex;
                step                     = n < 0 ? -1 : 1;

                // Get a plain-object expression of this history’s state to apply deltas against.
                expr = this.state.express();

                // Process the elements of `history` in blocks, each consisting of one state
                // element at the tail, followed by a contiguous sequence of zero or more
                // mutations.
                while ( historyIndex !== targetHistoryIndex ) {

                    // `blockLength` refers to the number of mutations in this block; it does not
                    // account for the trailing state element (thus its range is `[0..]`).
                    blockLength = stateIndices[ stateIndicesIndex + 1 ] - historyIndex - 1;

                    // `mutationOffset` (which on the first run of the outer loop will already
                    // have been initialized to `this.mutationOffset`) iterates either backward
                    // or forward through the mutations in this block, accreting an aggregate
                    // delta, which, immediately prior to the next state change, will be applied
                    // to the state in a single mutation operation.
                    if ( step < 0 ) {
                        mutationOffset || ( mutationOffset = blockLength );
                    } else {
                        mutationOffset += 1;
                    }
                    while ( 0 < mutationOffset && mutationOffset <= blockLength ) {
                        i = historyIndex + mutationOffset;
                        delta = history[i];
                        history[i] = Z.delta( expr, delta );
                        deltaSum = Z.clone( deltaSum, delta );
                        mutationOffset += step;
                    }
                    mutationOffset = 0;

                    historyIndex = stateIndices[ stateIndicesIndex += step ];

                    // If instigating transitions on each iteration, then the transition for the
                    // next iteration’s block is made at the end of this iteration.
                    if ( !directly ) {
                        if ( deltaSum ) {
                            this.mutateState( deltaSum );
                            deltaSum = null;
                        }
                        this.historyIndex = historyIndex;
                        this.changeState( history[ historyIndex ] );
                    }
                }

                if ( directly ) {
                    deltaSum && this.mutateState( deltaSum );
                    this.changeState( history[ targetHistoryIndex ] );
                }

                this.mutationOffset = 0;
            }
        },

        changeState: function ( target ) {
            var result;
            this.traverse = Z.noop;
            result = this.state.change( target );
            delete this.traverse;
            return result;
        },

        mutateState: function ( expr ) {
            this.state.mutate( expr );
        },

        pushState: function ( state ) {
            var elements = this.elements,
                history = this.history,
                index = this.historyIndex + this.mutationOffset + 1;

            // Splice off the forward elements.
            history.splice( index, history.length - index );

            // Add `state` to the new end of `history`.
            this.historyIndex = index;
            this.mutationOffset = 0;
            state instanceof State || ( state = this.state.query( state ) );
            history[ index ] = state.toString();
        },

        replaceState: function ( state ) {
            var history = this.history,
                index = this.historyIndex
            // 
        },

        pushMutation: function ( mutation ) {

        },

        replaceMutation: function ( mutation ) {

        },

        previousStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndicesIndex - 1 ] :
                this.historyIndex - 1;
        },

        nextStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndicesIndex + 1 ] :
                this.historyIndex + 1;
        },

        currentState: function () {
            var selector = this.history[ this.historyIndex ];
            return this.state.query( selector ) || selector;
        },

        previousState: function () {
            var selector = this.history[ this.previousStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        nextState: function () {
            var selector = this.history[ this.nextStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        destroy: function () {
            this.state = this.history = null;
        }
    });

    return StateHistory;
})();

// ## Transition <a class="icon-link" name="transition" href="#transition"></a>
// 
// A `Transition` is a transient `State` adopted by a controller as it changes from one of its
// proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor* between its **origin**
// and **target** states. During this time it behaves as if it were a substate of that domain
// state, inheriting method calls and propagating events in the familiar fashion.

var Transition = ( function () {
    Z.inherit( Transition, State );

    // <a class="icon-link" name="transition--constructor" href="#transition--constructor"></a>
    // 
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
            guards: guards,
            action: action
        });

        Z.assign( this, {
            // <a class="icon-link"
            //    name="transition--constructor--superstate"
            //    href="#transition--constructor--superstate"></a>
            // 
            // #### superstate
            // 
            // A [`Transition`](#transition) instance uses `superstate` to track its position as it
            // traverses the [`State`](#state) subtree that defines its domain.
            superstate: function () { return attachment; },

            // <a class="icon-link"
            //    name="transition--constructor--attach-to"
            //    href="#transition--constructor--attach-to"></a>
            // 
            // #### attachTo
            attachTo: function ( state ) { return attachment = state; },

            // <a class="icon-link"
            //    name="transition--constructor--controller"
            //    href="#transition--constructor--controller"></a>
            // 
            // #### controller
            controller: function () { return controller; },

            // <a class="icon-link"
            //    name="transition--constructor--origin"
            //    href="#transition--constructor--origin"></a>
            // 
            // #### origin
            // 
            // A transition’s **origin** is the controller’s most recently active [`State`](#state)
            // that is not itself a [`Transition`](#transition).
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // <a class="icon-link"
            //    name="transition--constructor--source"
            //    href="#transition--constructor--source"></a>
            // 
            // #### source
            // 
            // A transition’s **source** is the [`State`](#state) or [`Transition`](#transition) that
            // immediately preceded `this`.
            source: function () { return source; },

            // <a class="icon-link"
            //    name="transition--constructor--target"
            //    href="#transition--constructor--target"></a>
            // 
            // #### target
            // 
            // The intended destination [`State`](#state) for this transition. If a target is
            // invalidated by a controller that [`change`](#state-controller--privileged--change)s
            // state again before this transition completes, then this transition is aborted and the
            // `change` call will create a new transition with `this` as its `source`.
            target: function () { return target; },

            // <a class="icon-link"
            //    name="transition--constructor--set-callback"
            //    href="#transition--constructor--set-callback"></a>
            // 
            // #### setCallback
            // 
            // Allows the callback function to be set or changed prior to the transition’s
            // completion.
            setCallback: function ( fn ) { return callback = fn; },

            // <a class="icon-link"
            //    name="transition--constructor--aborted"
            //    href="#transition--constructor--aborted"></a>
            // 
            // #### aborted
            aborted: function () { return aborted; },

            // <a class="icon-link"
            //    name="transition--constructor--start"
            //    href="#transition--constructor--start"></a>
            // 
            // #### start
            // 
            // Starts the transition; if an `action` is defined, that function is responsible
            // for declaring an end to the transition by calling
            // [`end()`](#transitions--constructor--end). Otherwise, the transition is necessarily
            // synchronous and is concluded immediately.
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

            // <a class="icon-link"
            //    name="transition--constructor--abort"
            //    href="#transition--constructor--abort"></a>
            // 
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

            // <a class="icon-link"
            //    name="transition--constructor--end"
            //    href="#transition--constructor--end"></a>
            // 
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

            // <a class="icon-link"
            //    name="transition--constructor--destroy"
            //    href="#transition--constructor--destroy"></a>
            // 
            // #### destroy
            // 
            // Destroys this transition and clears its held references, and does the same for any
            // aborted `source` transitions that preceded it.
            destroy: function () {
                source instanceof Transition && source.destroy();
                target = attachment = controller = null;
            }
        });

        // [`Transition`](#transition) also inherits certain privileged methods from
        // [`State`](#state), which it obtains by partially applying the corresponding members of
        // [`State.privileged`](#state--privileged).
        Z.privilege( this, State.privileged, {
            'express mutate' : [ TransitionExpression, undefined, null, methods, events, guards ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );

        State.privileged.init( TransitionExpression ).call( this, expression );
    }

    // <a class="icon-link"
    //    name="transition--prototype--depth"
    //    href="#transition--prototype--depth"></a>
    // 
    // #### depth
    // 
    Transition.prototype.depth = function () {
        var s, count = 0;
        for ( s = this.source(); s instanceof Transition; s = s.source() ) count++;
        return count;
    };

    return Transition;
})();

// ## TransitionExpression <a class="icon-link" name="transition-expression" href="#transition-expression"></a>
// 
// A [`State`](#state) may hold **transition expressions** that describe the transition that will
// take place between any two given **origin** and **target** states.

var TransitionExpression = ( function () {
    var properties   = Z.assign( TRANSITION_PROPERTIES, null ),
        categories   = Z.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = Z.assign( TRANSITION_EVENT_TYPES ),
        guardActions = Z.assign( GUARD_ACTIONS );

    // <a class="icon-link"
    //    name="transition-expression--constructor"
    //    href="#transition-expression--constructor"></a>
    // 
    // ### Constructor
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        Z.edit( 'deep all', this, map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // <a class="icon-link"
    //    name="transition-expression--private"
    //    href="#transition-expression--private"></a>
    // 
    // ### Class-private functions

    // <a class="icon-link"
    //    name="transition-expression--private--interpret"
    //    href="#transition-expression--private--interpret"></a>
    // 
    // #### interpret
    // 
    // Rewrites a plain object map as a well-formed [`TransitionExpression`](#transition-expression),
    // making the appropriate inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var result = Z.assign( {}, properties, categories ),
            key, value, category, events;

        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                result[ key ] = Z.edit( 'deep all', result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isFunction( value ) ? 'methods' :
                    undefined;
                if ( category ) {
                    ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
                }
            }
        }
        for ( key in ( events = result.events ) ) {
            Z.isFunction( value = events[ key ] ) && ( events[ key ] = [ value ] );
        }

        return result;
    }

    return TransitionExpression;
})();


// Classes are made available as members of the exported module.
Z.assign( state, {
    State: State,
    StateExpression: StateExpression,
    StateController: StateController,
    StateEventCollection: StateEventCollection,
    Transition: Transition,
    TransitionExpression: TransitionExpression
});

}).call( this );

