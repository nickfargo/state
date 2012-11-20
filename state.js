// Copyright (C) 2011-2012 Nick Fargo, Z Vector Inc.
//
// [`LICENSE`](https://github.com/nickfargo/state/blob/master/LICENSE) MIT.
//
// **State** implements state-driven behavior directly into any JavaScript
// object.
//
// > [statejs.org](/)
// > [blog](/blog/)
// > [docs](/docs/)
// > [api](/api/)
// > [tests](/tests/)
// > <a class="icon-invertocat" href="http://github.com/nickfargo/state"></a>

;( function ( undefined ) {

"use strict";

var global = this,

    meta = {
        VERSION: '0.0.7',

        noConflict: ( function () {
            var original = global.state;
            return function () {
                global.state = original;
                return this;
            };
        }() ),

        options: {
            memoizeProtostates: true
        }
    },

    // The lone dependency of **State** is [Omicron](http://github.com/nickfargo/omicron),
    // a library that assists with tasks such as object manipulation,
    // differential operations, and facilitation of prototypal inheritance.
    O = typeof require !== 'undefined' ? require('omicron') : global.O;


var rxTransitionArrow       = /^\s*([\-|=]>)\s*(.*)/,
    transitionArrowMethods  = { '->': 'change', '=>': 'changeTo' };


// ## [state()](#module)
// 
// The `state` module is exported as a function. This is used either: (1) to
// generate a formal [`StateExpression`](#state-expression); or (2) to bestow
// an arbitrary `owner` object with a new implementation of state based on the
// supplied `expression`, returning the owner’s initial
// [`State`](#state).
// 
// All arguments are optional. If only one `object`-typed argument is provided,
// it is assigned to the `expression` parameter. If no `owner` is present,
// `state` returns a `StateExpression` based on the contents of `expression`
// (and `attributes`). If both an `owner` and `expression` are present, `state`
// acts in the second capacity, causing `owner` to become stateful. The
// `attributes` argument may include any of the words defined in
// [`STATE_ATTRIBUTE_MODIFIERS`](#module--constants--state-attribute-modifiers),
// which are encoded into the provided `expression`.
// 
// > See also:
// > [`State`](#state), [`STATE_ATTRIBUTES`](#module--constants--state-attributes),
// > [`StateExpression`](#state-expression), [`StateController`](#state-controller)
//
// > [The `state` function](/docs/#getting-started--the-state-function)
// > [`state()`](/api/#module)
function state (
                      /*Object*/ owner,      // optional
                      /*String*/ attributes, // optional
    /*StateExpression | Object*/ expression, // optional
             /*Object | String*/ options     // optional
) {
    if ( arguments.length < 2 ) {
        if ( typeof owner === 'string' ) {
            attributes = owner;
        } else {
            expression = owner;
        }
        owner = undefined;
    } else {
        if ( typeof owner === 'string' ) {
            options = expression;
            expression = attributes;
            attributes = owner;
            owner = undefined;
        }
        if ( typeof attributes !== 'string' ) {
            options = expression;
            expression = attributes;
            attributes = undefined;
        }
    }
    
    expression = new StateExpression( attributes, expression );

    return owner ?
        new StateController( owner, expression, options ).current() :
        expression;
}

O.assign( state, meta );


// ### [Module-level constants](#module--constants)

// #### [State attributes](#module--constants--state-attributes)
// 
// Attribute values are stored as a bit field in a [`State`](#state) instance.
// Most attributes enumerated here also correspond with a
// [modifier](#module--constants--state-attribute-modifiers)
// keyword that can be included in a call to [`state()`](#module).
var STATE_ATTRIBUTES = {
    NORMAL      : 0x0,

    // ##### [virtual](#module--constants--state-attributes--virtual)
    // 
    // A **virtual state** is a lightweight inheritor of a **protostate**
    // located higher in the owner object’s prototype chain. Notably, as
    // virtual states are created automatically, no modifier keyword exists
    // for the `virtual` attribute.
    VIRTUAL     : 0x1,

    // ##### [mutable](#module--constants--state-attributes--mutable)
    // 
    // By default, states are **weakly immutable**; i.e., once a `State` has
    // been constructed, its declared data, methods, guards, substates, and
    // transitions cannot be altered. By including the `mutable` attribute in
    // the state’s expression, this restriction is lifted. Mutability is also
    // inherited from any of a state’s superstates or protostates.
    MUTABLE     : 0x2,

    // ##### [finite](#module--constants--state-attributes--finite)
    // 
    // If a state is declared `finite`, no substates or descendant states may
    // be added, nor may any be removed without also destroying the state
    // itself.
    FINITE      : 0x4,

    // ##### [static](#module--constants--state-attributes--static)
    // 
    // If a state is declared `static`, none of its contents may be changed
    // except for its substates.
    // *(Reserved; not presently implemented.)*
    STATIC      : 0x8,

    // ##### [immutable](#module--constants--state-attributes--immutable)
    // 
    // Adding the `immutable` attribute causes a state to become **strongly
    // immutable**, wherein it guarantees immutability absolutely, throughout
    // all inheriting states, overriding and negating any included or inherited
    // `mutable` attributes.
    IMMUTABLE   : 0x10,

    // ##### [initial](#module--constants--state-attributes--initial)
    // 
    // Marking a state `initial` specifies which state a newly stateful object
    // should assume.
    INITIAL     : 0x20,

    // ##### [conclusive](#module--constants--state-attributes--conclusive)
    // 
    // Once a state marked `conclusive` is entered, it cannot be exited,
    // although transitions may still freely traverse within its substates.
    CONCLUSIVE  : 0x40,

    // ##### [final](#module--constants--state-attributes--final)
    // 
    // Once a state marked `final` is entered, no further outbound transitions
    // within its local region are allowed.
    FINAL       : 0x80,

    // ##### [abstract](#module--constants--state-attributes--abstract)
    // 
    // An `abstract` state is used only as a source of inheritance, and cannot
    // itself be current. Consequently a transition that targets an abstract
    // state will be automatically redirected to one of its substates.
    ABSTRACT    : 0x100,

    // ##### [concrete](#module--constants--state-attributes--concrete)
    // 
    // Marking a state `concrete` overrides an `abstract` attribute that would
    // otherwise be inherited from a protostate.
    CONCRETE    : 0x200,

    // ##### [default](#module--constants--state-attributes--default)
    // 
    // Marking a state `default` designates it as the actual target for any
    // transition that targets its abstract superstate.
    DEFAULT     : 0x400,

    // ##### [reflective](#module--constants--state-attributes--reflective)
    // 
    // A state marked `reflective` copies or “reflects” its properties onto
    // the owner whenever it becomes active. If the state is `mutable`, then
    // before it becomes inactive again it will “soak” into itself any new
    // properties that were added or changed on the owner while the state was
    // active.
    // *(Reserved; not presently implemented.)*
    REFLECTIVE  : 0x800,

    // ##### [history](#module--constants--state-attributes--history)
    // 
    // Marking a state with the `history` attribute causes its internal state
    // to be recorded in a sequential **history**. Whereas a `retained` state
    // is concerned only with the most recent internal state, a state’s history
    // can be traversed and altered, resulting in transitions back or forward
    // to previously or subsequently held internal states.
    // *(Reserved; not presently implemented.)*
    HISTORY     : 0x1000,

    // ##### [retained](#module--constants--state-attributes--retained)
    // 
    // A `retained` state is one that preserves its own internal state, such
    // that, after the state has become no longer active, a subsequent
    // transition targeting that particular state will automatically be
    // redirected to whichever of its descendant states was most recently
    // current.
    // *(Reserved; not presently implemented.)*
    RETAINED    : 0x2000,

    // ##### [shallow](#module--constants--state-attributes--shallow)
    // 
    // Normally, states that are `retained` or that keep a `history` persist
    // their internal state *deeply*, i.e., with a scope extending over all of
    // the state’s descendant states. Marking a state `shallow` limits the
    // scope of its persistence to its immediate substates only.
    // *(Reserved; not presently implemented.)*
    SHALLOW     : 0x4000,

    // ##### [versioned](#module--constants--state-attributes--versioned)
    // 
    // Would cause alterations to a state to result in a reflexive transition,
    // with a delta object distinguishing the prior version of the state from
    // its new version. Should also add a history entry wherever appropriate,
    // representing the prior version and the delta.
    // *(Reserved; not presently implemented.)*
    VERSIONED   : undefined,

    // ##### [concurrent](#module--constants--state-attributes--concurrent)
    // 
    // In a state marked `concurrent`, the substates are considered
    // **concurrent orthogonal regions**. Upon entering a concurrent state,
    // the controller creates a new set of subcontrollers, one for each region,
    // which will exist as long as the concurrent state remains active. Method
    // calls are forwarded to at most one of the regions, or if a reduction
    // function is associated with the given method, the call is repeated for
    // each region and the results reduced accordingly on their way back to the
    // owner.
    // *(Reserved; not presently implemented.)*
    CONCURRENT  : 0x8000
//
};

// #### [State attribute modifiers](#module--constants--state-attribute-modifiers)
// 
// The subset of attributes that are valid or reserved keywords for the
// `attributes` argument in a call to the exported [`state`](#module)
// function.
var STATE_ATTRIBUTE_MODIFIERS = [
        'mutable finite static immutable',
        'initial conclusive final',
        'abstract concrete default',
        'reflective',
        'history retained shallow versioned',
        'concurrent'
    ].join(' ');

// #### [State expression categories](#module--constants--state-expression-categories)
var STATE_EXPRESSION_CATEGORIES =
        'data methods events guards states transitions';

// #### [State event types](#module--constants--state-event-types)
var STATE_EVENT_TYPES =
        'construct depart exit enter arrive destroy mutate noSuchMethod';

// #### [Guard actions](#module--constants--guard-actions)
var GUARD_ACTIONS =
        'admit release';

// #### [Transition properties](#module--constants--transition-properties)
var TRANSITION_PROPERTIES =
        'origin source target action conjugate';

// #### [Transition expression categories](#module--constants--transition-expression-categories)
var TRANSITION_EXPRESSION_CATEGORIES =
        'methods events guards';

// #### [Transition event types](#module--constants--transition-event-types)
var TRANSITION_EVENT_TYPES =
        'construct destroy enter exit start end abort';

// The [`state`](#module) module is exported via CommonJS on the server, and
// globally in the browser.
O.env.server && ( module.exports = exports = state );
O.env.client && ( global['state'] = state );

// #### [module](#module--constants--module)
// 
// References or creates a unique object visible only within the lexical scope
// of this module.
var __MODULE__ = O.env.server ? module : { exports: state };

// ### [state.method](#module--method)
//
// Returns a `factory` to be called internally, which will flatten the scope
// of the provided `fn`, reclose it both over any provided `bindings` and over
// a static set of `lexicals` based on `autostate`, which is provided to
// `factory` as the `State` instance that will contain the **lexical state
// method** that `factory` produces.
//
// > [`state.method`](/api/#module--method)
//
// > [Lexical binding in state methods](/blog/lexical-binding-in-state-methods/)
state.method = ( function () {
    var lexicals = [ 'state', 'autostate', 'protostate' ];

    var rx = /^(function\b\s*(?:[$_A-Za-z])?\s*\((?:.*?)\)\s*\{)([\s\S]*)/;
    var s = "return $1\n" +
            "  var superstate, owner;\n" +
            "  if ( this instanceof state.State ) {\n" +
            "    superstate = this.superstate();\n" +
            "    owner = this.owner();\n" +
            "  }\n" +
            "$2;";

    function method ( bindings, fn ) {

        function factory ( autostate ) {
            // Invocation from outside the module is forbidden, as this could
            // expose `bindings`, which must remain private.
            if ( this !== __MODULE__ ) throw ReferenceError;

            // With proper `bindings` and `fn` arguments, forward the
            // invocation to `createMethod`.
            if ( typeof bindings === 'object' && typeof fn === 'function' ) {
                return createMethod( factory, autostate, bindings, fn );
            }

            // If passed `bindings` only, return a partially applied function
            // that accepts `fn` later.
            else if ( typeof bindings === 'object' && fn === undefined ) {
                return function ( fn ) {
                    return createMethod( factory, autostate, bindings, fn );
                };
            }

            // If passed only `fn` as the first argument, assume no `bindings`.
            else if ( typeof bindings === 'function' && fn === undefined ) {
                return createMethod( factory, autostate, null, bindings );
            }
        }
        factory.isLexicalStateMethodFactory = true;

        return factory;
    }

    function createMethod ( factory, autostate, bindings, fn ) {
        var identifiers, values, i, l, params, args, body, result;

        // Gather all the identifiers that the transformed `fn` will be closed
        // over and arrange them into an array of named `params`.
        identifiers = bindings instanceof Object && O.keys( bindings ) || [];
        i = 0; l = identifiers.length; values = new Array(l);
        for ( ; i < l; i++ ) values[i] = bindings[ identifiers[i] ];
        params = identifiers.concat( lexicals );

        // Gather all the values that will be mapped to the `params`.
        args = [ state, autostate, autostate.protostate() ];
        values.length && ( args = values.concat( args ) );

        // Write the body of the function that wraps `fn`, and inject `fn` with
        // references to the superstate and owner of the context `State`.
        body = Function.prototype.toString.call( fn ).replace( rx, s );

        // Generate the wrapper function and immediately apply it with all of
        // the closed binding values.
        result = Function.apply( null, params.concat( body ) )
                         .apply( null, args );

        // Save the `factory` from which the method was created, so that the
        // method can be cloned or exported, e.g., with
        // [`express()`](/api/#state--methods--express), to a separate
        // `State`, where the method will need to be re-transformed with
        // bindings to the new state’s lexical environment.
        result.factory = factory;

        result.isLexicalStateMethod = true;

        return result;
    }

    return method;
}() );

// ## [State](#state)
// 
// > [State](/api/#state)

// ### [`state/__pre.js`](#state--__pre.js)

var State = ( function () {

var SA = STATE_ATTRIBUTES,
    
    // Attribute bitfield constants will be used extensively in the `State`
    // [constructor](#state--constructor.js) and the
    // [attribute methods](#state--attributes.js), so make them accessible
    // as free variables.
    NORMAL      = SA.NORMAL,
    VIRTUAL     = SA.VIRTUAL,
    MUTABLE     = SA.MUTABLE,
    FINITE      = SA.FINITE,
    STATIC      = SA.STATIC,
    IMMUTABLE   = SA.IMMUTABLE,
    INITIAL     = SA.INITIAL,
    CONCLUSIVE  = SA.CONCLUSIVE,
    FINAL       = SA.FINAL,
    ABSTRACT    = SA.ABSTRACT,
    CONCRETE    = SA.CONCRETE,
    DEFAULT     = SA.DEFAULT,
    REFLECTIVE  = SA.REFLECTIVE,
    HISTORY     = SA.HISTORY,
    RETAINED    = SA.RETAINED,
    SHALLOW     = SA.SHALLOW,
    CONCURRENT  = SA.CONCURRENT,

    // All attributes except `virtual` are inherited via protostates.
    PROTOSTATE_HERITABLE_ATTRIBUTES =
        MUTABLE     |  FINITE      |  STATIC     |  IMMUTABLE  |
        INITIAL     |  CONCLUSIVE  |  FINAL      |
        ABSTRACT    |  CONCRETE    |  DEFAULT    |
        REFLECTIVE  |
        HISTORY     |  RETAINED    |  SHALLOW    |
        CONCURRENT
    ;

O.assign( State, SA );

// ### [`state/constructor.js`](#state--constructor.js)

// ### [Constructor](#state--constructor)
function State ( superstate, name, expression ) {
    if ( !( this instanceof State ) ) {
        return new State( superstate, name, expression );
    }

    var attributes, controller, superAttributes, protostate, protoAttributes;

    attributes = expression && expression.attributes || NORMAL;

    // #### [name](#state--constructor--name)
    // 
    // Returns the local name of this state.
    //
    // > [name](/api/#state--methods--name)
    this.name = O.stringFunction( function () { return name || ''; } );

    // A root state is created by a [`StateController`](#state-controller),
    // which passes a reference to itself into the `superstate` parameter,
    // signaling that a `controller` method closing over the reference needs to
    // be created for this instance.
    if ( superstate instanceof StateController ) {
        controller = superstate; superstate = undefined;
        controller.root = O.thunk( this );
        this.controller = O.thunk( controller );
    }

    // Otherwise this state is an inheritor of an existing superstate.
    else if ( superstate ) {
        this.superstate = privileged.superstate( superstate );

        // The `mutable` and `finite` attributes are inherited from the
        // superstate.
        superAttributes = superstate.attributes();
        attributes |= superAttributes & ( MUTABLE | FINITE );
    }

    // The set of “protostate-heritable” attributes are inherited from the
    // protostate.
    if ( protostate = this.protostate() ) {
        protoAttributes = protostate.attributes();
        protoAttributes &= PROTOSTATE_HERITABLE_ATTRIBUTES;

        // Literal `concrete` forcibly contradicts literal `abstract`; if a
        // bad production includes both attributes, negate `abstract`.
        if ( attributes & CONCRETE ) {
            attributes &= ~ABSTRACT;
        }

        // Literal `abstract` may override inherited `concrete`, and vice
        // versa, so filter those attributes out of the protostate before
        // inheriting.
        if ( attributes & ( ABSTRACT | CONCRETE ) ) {
            protoAttributes &= ~( ABSTRACT | CONCRETE );
        }
        attributes |= protoAttributes;
    }

    // If at this point the state is not `abstract`, then `concrete` must be
    // imposed.
    if ( ~attributes & ABSTRACT ) {
        attributes |= CONCRETE;
    }

    // Literal or inherited `immutable` is an absolute contradiction of
    // `mutable` and implication of `finite`.
    attributes |= ( superAttributes | protoAttributes ) & IMMUTABLE;
    if ( attributes & IMMUTABLE ) {
        attributes &= ~MUTABLE;
        attributes |= FINITE;
    }

    // Only a few instance methods are required for a virtual state,
    // including one ([`realize`](#state--privileged--realize)) method which
    // if called later will convert the virtual state into a real state.
    if ( attributes & VIRTUAL ) {
        this.attributes = privileged.attributes( attributes );
        this.realize = privileged.realize( attributes );
        attributes & MUTABLE && O.assign( this, mutableVirtualMethods );
    }

    // For a real state, the remainder of construction is delegated to the
    // class-private [`realize`](#state--private--realize) function.
    else {
        realize.call( this, superstate, attributes, expression );
    }

    // Additional property assignments for easy viewing in the inspector.
    if ( O.env.debug ) {
        this[' <owner>'] = this.owner();
        this[' <path>']  = this.derivation( true ).join('.');
        this['<attr>']   = StateExpression.decodeAttributes( attributes );
    }
}

State.prototype.name = O.noop;

var privileged = State.privileged = {};

// ### [`state/core.js`](#state--core.js)
//
// Methods for initializing and properly destroying a `State` instance.

O.assign( State.privileged, {

    // #### [init](#state--privileged--init)
    // 
    // Builds out the state’s members based on the expression provided.
    //
    // > [init](#state--methods--init)
    init: function ( /*Function*/ expressionConstructor ) {
        return function ( /*<expressionConstructor> | Object*/ expression ) {
            this.__initializing__ = true;
            this.mutate( expression );
            delete this.__initializing__;
            this.emit( 'construct', expression, false );
            return this;
        };
    },

    // #### [destroy](#state--privileged--destroy)
    // 
    // Attempts to cleanly destroy this state and all of its substates.
    // A `destroy` event is issued to each state after it is destroyed.
    //
    // > [destroy](#state--methods--destroy)
    destroy: function ( setSuperstate, methods, events, substates ) {
        return function () {
            var superstate = this.superstate(),
                controller = this.controller(),
                owner = controller.owner(),
                transition = controller.transition(),
                origin, target, key, methodName, delegator, method, stateName;

            // If a transition is underway that involves this state, then the
            // state cannot be destroyed.
            if ( transition ) {
                origin = transition.origin();
                target = transition.target();

                if ( origin.isIn( this ) || target.isIn( this ) ) {
                    return false;
                }
            }

            // Descendant states are destroyed bottom-up.
            for ( stateName in substates ) {
                if ( O.hasOwn.call( substates, stateName ) ) {
                    substates[ stateName ].destroy();
                }
            }

            // `destroy` is the final event emitted.
            this.emit( 'destroy', false );
            for ( key in events ) {
                events[ key ].destroy();
                delete events[ key ];
            }

            // The state must remove itself from its superstate.
            if ( superstate ) {

                // A mutable superstate has a `removeSubstate` method already
                // available.
                if ( superstate.isMutable() ) {
                    superstate.removeSubstate( this.name() );
                }

                // An immutable superstate must be peeked to acquire a
                // `removeSubstate` method.
                else {
                    privileged.removeSubstate(
                        superstate.peek( __MODULE__, 'attributes' ),
                        superstate.peek( __MODULE__, 'substates' )
                    ).call( superstate, this.name() );
                }
            }

            // When the root state is destroyed, the owner gets back its
            // original methods, and the corresponding delegator for each such
            // method is destroyed.
            else {
                for ( methodName in methods ) {
                    delegator = owner[ methodName ];
                    if ( delegator ) {
                        method = delegator.original;
                        if ( method ) {
                            delete delegator.original;
                            owner[ methodName ] = method;
                        } else {
                            delete owner[ methodName ];
                        }
                    }
                }

                // The `destroy` call is propagated to the root’s controller,
                // unless the controller itself instigated the call, in which
                // case its own `destroy` method will already have been removed.
                controller.destroy && controller.destroy();
            }

            setSuperstate( undefined );

            // A flag is set that can be observed later by anything retaining
            // a reference to this state (e.g. a memoization) which would be
            // withholding it from being garbage-collected. A well-behaved
            // retaining entity should check this flag as necessary to
            // reassert the validity of its reference, and discard the
            // reference after it observes `destroyed` to have been set to
            // `true`.
            return this.destroyed = true;
        };
    }
});

State.prototype.destroy = O.thunk( false );

// ### [`state/internal.js`](#state--internal.js)
//
// For internal use only. Code here is not documented in the public API.

// #### [peek](#state--privileged--peek)
// 
// Exposes private entities to code within the same module-level lexical
// scope. Callers must authenticate themselves as internal by providing a
// `referenceToModule` that matches the closed unique module-scoped object
// [`__MODULE__`](#module--constants--module) (which in a CommonJS environment
// is equivalent to the standard `module`).
State.privileged.peek = function (
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
        return name ? members[ name ] : O.clone( members );
    };
};

State.prototype.peek = O.noop;

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

State.prototype.realize = O.getThis;

// ### [`state/expression.js`](#state--expression.js)

// #### [express](#state--privileged--express)
// 
// Returns an expression of the state of `this` state — a snapshot of the
// state’s current contents.
State.privileged.express = ( function () {
    function clone ( obj ) {
        if ( obj === undefined ) return;
        var out = null, key, value;
        for ( key in obj ) {
            value = obj[ key ];
            out || ( out = {} );
            out[ key ] = value && typeof value === 'object' ?
                O.clone( obj[ key ] ) :
                value;
        }
        return out;
    }

    function cloneMethods ( methods ) {
        if ( methods === undefined ) return;
        var out = null, name, method;
        for ( name in methods ) {
            method = methods[ name ];
            out || ( out = {} );
            out[ name ] = method.isLexicalStateMethod ?
                method.factory :
                method;
        }
        return out;
    }

    function cloneEvents ( events ) {
        if ( events === undefined ) return;
        var out = null, type, emitter;
        for ( type in events ) if ( emitter = events[ type ] ) {
            out || ( out = {} );
            out[ type ] = O.clone( emitter.items );
        }
        return out;
    }

    function cloneSubstates ( substates, typed ) {
        if ( substates === undefined ) return;
        var out = null;
        O.forEach( substates, function ( substate, name ) {
            ( out || ( out = {} ) )[ name ] = substate.express( typed );
        });
        return out;
    }

    // By default the returned expression is returned as a plain `Object`; if
    // `typed` is truthy, the expression is a formally typed
    // [`StateExpression`](#state-expression).
    return function (
        /*Function*/ ExpressionConstructor,
          /*Number*/ attributes,
          /*Object*/ data, methods, events, guards, substates, transitions
    ) {
        return function ( /*Boolean*/ typed ) {
            var expression = {};

            O.edit( expression, {
                attributes:  attributes,
                data:        clone( data ),
                methods:     cloneMethods( methods ),
                events:      cloneEvents( events ),
                guards:      clone( guards ),
                states:      cloneSubstates( substates, typed ),
                transitions: clone( transitions )
            });

            return typed ?
                new ExpressionConstructor( expression ) :
                expression;
        };
    };
}() );

State.prototype.express = O.noop;

// ### [`state/mutation.js`](#state--mutation.js)

// #### [mutate](#state--privileged--mutate)
// 
// Transactionally mutates the state by adding, updating, or removing items
// as specified by the expression provided in `expr`. 
State.privileged.mutate = function (
    /*Function*/ ExpressionConstructor,
      /*Number*/ attributes,
      /*Object*/ data, methods, events, guards, substates, transitions
) {
    return function (
        /*<expressionConstructor> | Object*/ expr
    ) {
        expr instanceof ExpressionConstructor ||
            ( expr = new ExpressionConstructor( expr ) );

        var self = this,
            NIL = O.NIL,
            before, emitter, name, value, after, delta;

        var addMethod, removeMethod;

        // The privileged `init` method uses `mutate` for the state’s
        // initial build, but with the resultant `mutate` event suppressed.
        if ( !this.__initializing__ ) {
            // A snapshot of the `before` condition of this state is taken,
            // to be compared later with an `after` snapshot.
            before = this.express();
        }

        // This invocation of `mutate` utilizes the set of privileged `add*`
        // methods, however, since they are being called as part of a single
        // operation, each must suppress its usual emission of its own
        // `mutate` event.
        this.__atomic__ = true;

        // Data is already set up to handle differentials that contain `NIL`
        // values.
        data && expr.data && this.data( expr.data );

        // Methods are stored as a simple key mapping, and
        // [`addMethod`](#state--privileged--add-method) can be used both to
        // create an entry and to update an existing entry, without any
        // additional side-effects, so method expressions can simply be
        // compared against the `NIL` value.
        emitter = methods && expr.methods;
        for ( name in emitter ) {
            if ( O.hasOwn.call( emitter, name ) ) {
                value = emitter[ name ];
                value !== NIL ?
                    this.addMethod( name, value ) :
                    this.removeMethod( name );
            }
        }

        // Event listeners for a given event type might be expressed as a
        // simple `Array` of items to be added, as a plain `Object` that
        // maps items to specific keys in the internal event emitter that
        // should be updated or deleted, or as an `Array` that also includes
        // one or more such `Object`s.
        if ( events && expr.events ) {
            O.forEach( expr.events, function ( object, type ) {
                var items, edit, add, i, l,
                    eventCollection = events[ type ];

                if ( object === NIL ) {
                    return eventCollection && eventCollection.empty();
                }

                // If an event emitter object does not already exist for
                // this event type, then one will be created, so long as
                // `object` is expected to contain items to be added.
                if ( !eventCollection && object && !O.isEmpty( object ) ) {
                    eventCollection = events[ type ] =
                        new StateEventEmitter( self, type );
                }

                items = eventCollection.items;

                edit = function ( object ) {
                    var key, value;
                    for ( key in object ) {
                        if ( O.hasOwn.call( object, key ) ) {
                            value = object[ key ];
                            if ( value === NIL ) {
                                eventCollection.remove( key );
                            } else if ( value && value !== items[ key ] ) {
                                eventCollection.set( key, value );
                            }
                        }
                    }
                };

                if ( O.isArray( object ) ) {
                    add = function ( object ) {
                        return self.addEvent( type, object );
                    };
                    for ( i = 0, l = object.length; i < l; i++ ) {
                        value = object[i];
                        if ( value == null || value === NIL ) continue;
                        ( O.isPlainObject( value ) ? edit : add )( value );
                    }
                } else if ( O.isPlainObject( object ) ) {
                    edit( object );
                }

                eventCollection.length ||
                    eventCollection.destroy() && delete events[ type ];
            });
        }

        // Guards are stored as simple objects, and altering them causes no
        // side-effects, so a deep `edit` is sufficient.
        guards && expr.guards && O.edit( 'deep', guards, expr.guards );

        // Substates are instances of [`State`](#State), which are either
        // created, destroyed, or recursively updated in place, as specified
        // by `expr.states`.
        emitter = substates && expr.states;
        for ( name in emitter ) if ( O.hasOwn.call( emitter, name ) ) {
            value = emitter[ name ];
            if ( name in substates ) {
                value === NIL ?
                    substates[ name ].destroy() :
                    substates[ name ].mutate( value, false );
            } else {
                this.addSubstate( name, value );
            }
        }

        // Transitions are instances of
        // [`TransitionExpression`](#transition-expression), which are
        // either created, deleted, or replaced, as specified by
        // `expr.transitions`.
        emitter = transitions && expr.transitions;
        for ( name in emitter ) if ( O.hasOwn.call( emitter, name ) ) {
            value = emitter[ name ];
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

        // Finally the `before` snapshot is used to acquire the `delta` of the
        // mutation, which is emitted as part of a `mutate` event.
        if ( before ) {
            after = this.express();
            delta = O.diff( before, after );
            if ( !O.isEmpty( delta ) ) {
                this.emit( 'mutate', [ expr, delta, before, after ], false );
            }
        }

        return this;
    };
};

// #### [mutate](#state--prototype--mutate)
// 
// By default states are weakly immutable and their contents cannot be
// changed, so they will not possess a `mutate` instance method unless they
// bear the `mutable` attribute. However, because a weak-immutable superstate
// may contain mutable substates, any parts of a mutation operation that
// correspond to mutable states must be recursed.
//
// > See also: [mutate (instance)](#state--privileged--mutate)
State.prototype.mutate = function ( expr ) {
    var name, value,
        NIL = O.NIL,
        ss = expr.states,
        substates = this.substates();

    for ( name in ss ) if ( O.hasOwn.call( ss, name ) ) {
        value = ss[ name ];
        if ( name in substates ) {
            value !== NIL && substates[ name ].mutate( value, false );
        } else {
            this.addSubstate( name, value );
        }
    }
};

// ### [`state/attributes.js`](#state--attributes.js)
//
// Methods that inspect a state’s attributes.
//
// > [Attributes](/docs/#concepts--attributes)
// > [Attributes](/api/#state--attributes)

// #### [attributes](#state--privileged--attributes)
// 
// Returns the bit-field representing the state’s attribute flags.
//
// > [attributes](/api/#state--methods--attributes)
State.privileged.attributes = function ( /*Number*/ attributes ) {
    return function () { return attributes; };
};

O.assign( State.prototype, {
    attributes: O.thunk( NORMAL ),
    isVirtual:    function () { return !!( this.attributes() & VIRTUAL    ); },
    isMutable:    function () { return !!( this.attributes() & MUTABLE    ); },
    isFinite:     function () { return !!( this.attributes() & FINITE     ); },
    isStatic:     function () { return !!( this.attributes() & STATIC     ); },
    isImmutable:  function () { return !!( this.attributes() & IMMUTABLE  ); },
    isInitial:    function () { return !!( this.attributes() & INITIAL    ); },
    isConclusive: function () { return !!( this.attributes() & CONCLUSIVE ); },
    isFinal:      function () { return !!( this.attributes() & FINAL      ); },
    isAbstract:   function () { return !!( this.attributes() & ABSTRACT   ); },
    isConcrete:   function () { return !!( this.attributes() & CONCRETE   ); },
    isDefault:    function () { return !!( this.attributes() & DEFAULT    ); },
    isReflective: function () { return !!( this.attributes() & REFLECTIVE ); },
    hasHistory:   function () { return !!( this.attributes() & HISTORY    ); },
    isRetained:   function () { return !!( this.attributes() & RETAINED   ); },
    isShallow:    function () { return !!( this.attributes() & SHALLOW    ); },
    isConcurrent: function () { return !!( this.attributes() & CONCURRENT ); }
});

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

// ### [`state/currency.js`](#state--currency.js)
// 
// Methods that inspect or change the owner’s current state.

O.assign( State.prototype, {

    // #### [current](#state--prototype--current)
    // 
    // Gets the local controller’s current state.
    //
    // > [current](/api/#state--methods--current)
    current: function () {
        var controller = this.controller();
        if ( controller ) return this.controller().current();
    },

    // #### [isCurrent](#state--prototype--is-current)
    // 
    // Returns a `Boolean` indicating whether `this` is the owner’s current
    // state.
    //
    // > [isCurrent](/api/#state--methods--is-current)
    isCurrent: function () {
        return this.current() === this;
    },

    // #### [isActive](#state--prototype--is-active)
    // 
    // Returns a `Boolean` indicating whether `this` or one of its substates is
    // the owner’s current state.
    //
    // > [isActive](/api/#state--methods--is-active)
    isActive: function () {
        var current = this.current();
        return current === this || this.isSuperstateOf( current );
    },

    // #### [change](#state--prototype--change)
    // 
    // Forwards a `change` command to the state’s controller and returns its
    // result. Calling with no arguments directs the controller to change to
    // `this` state.
    // 
    // *Aliases:* **go**, **be**
    //
    // > See also: [`StateController.privileged.change`](#state-controller--privileged--change)
    //
    // > [change](/api/#state--methods--change)
    'change go be': function (
        /*State | String*/ target,  // optional
                /*Object*/ options  // optional
    ) {
        var controller = this.controller();

        if ( !arguments.length ) return controller.change( this );

        return controller.change.apply( controller,
            target instanceof State || typeof target === 'string' ?
                arguments :
                [ this ].concat( arguments )
        );
    },

    // #### [changeTo](#state--prototype--change-to)
    // 
    // Calls `change` without regard to a `target`’s retained internal state.
    // 
    // *Alias:* **goTo**
    // 
    // > See also: [`State::change`](#state--prototype--change)
    'changeTo goTo': function (
        /*State | String*/ target,
                /*Object*/ options  // optional
    ) {
        target === undefined && ( target = this );
        options ? ( options.direct = true ) : ( options = { direct: true } );
        return this.change( target, options );
    }
});

// ### [`state/query.js`](#state--query.js)

O.assign( State.prototype, {

    // #### [query](#state--prototype--query)
    // 
    // Matches a `selector` string with the state or states it represents,
    // evaluated first in the context of `this`, then its substates, and then
    // its superstates, until all locations in the state tree have been
    // searched for a match of `selector`.
    // 
    // Returns the matched [`State`](#state), or an `Array` containing the set
    // of matched states. If a state to be tested `against` is provided, a
    // `Boolean` is returned, indicating whether `against` is the matched state
    // or is included in the matching set.
    // 
    // Setting `descend` to `false` disables recursion through the substates of
    // `this`, and likewise setting `ascend` to `false` disables the subsequent
    // recursion through its superstates.
    // 
    // *Alias:* **match**
    //
    // > [Selectors](/docs/#concepts--selectors)
    // > [query](/api/#state--methods--query)
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
            ascend = descend; descend = against; against = undefined;
        }
        descend === undefined && ( descend = true );
        ascend === undefined && ( ascend = true );
        viaProto === undefined && ( viaProto = true );

        // A few exceptional cases may be resolved early.
        if ( selector == null ) {
            return against !== undefined ? false : null;
        }
        if ( selector === '.' ) {
            return against !== undefined ? against === this : this;
        }
        if ( selector === '' ) {
            return against !== undefined ?
                against === this.root() :
                this.root();
        }

        // Absolute wildcard expressions compared against the root state pass
        // immediately.
        if ( against && against === this.root() &&
                selector.search(/^\*+$/) === 0
        ) {
            return true;
        }

        // Pure `.`/`*` expressions should not be recursed.
        selector.search(/^\.*\**$/) === 0 && ( descend = ascend = false );

        // If `selector` is an absolute path, evaluate it from the root state
        // as a relative path.
        if ( selector.charAt(0) !== '.' ) {
            return this.root().query( '.' + selector, against, descend, false );
        }

        // An all-`.` `selector` must have one `.` trimmed to parse correctly.
        selector = selector.replace( /^(\.+)\.$/, '$1' );

        // Split `selector` into tokens, consume the leading empty-string
        // straight away, then parse the remaining tokens. A `cursor` reference
        // to a matching [`State`](#state) in the tree is kept, beginning with
        // the context state (`this`), and updated as each token is consumed.
        parts = selector.split('.');
        for ( i = 1, l = parts.length, cursor = this; cursor; i++ ) {

            // Upon reaching the end of the token stream, return the
            // [`State`](#state) currently referenced by `cursor`.
            if ( i >= l ) return against ? against === cursor : cursor;

            // Consume a token.
            name = parts[i];

            // Interpret a **single wildcard** as any *immediate* substate of
            // the `cursor` state parsed thus far.
            if ( name === '*' ) {
                if ( !against ) return cursor.substates();
                else if ( cursor === against.superstate() ) return true;
                else break;
            }

            // Interpret a **double wildcard** as any descendant state of the
            // `cursor` state parsed thus far.
            else if ( name === '**' ) {
                if ( !against ) return cursor.substates( true );
                else if ( cursor.isSuperstateOf( against ) ) return true;
                else break;
            }

            // Empty string, the product of leading/consecutive dots, implies
            // `cursor`’s superstate.
            else if ( name === '' ) {
                cursor = cursor.superstate();
            }

            // Interpret any other token as an identifier that names a specific
            // substate of `cursor`.
            else if ( next = cursor.substate( name ) ) {
                cursor = next;
            }

            // If no matching substate exists, the query fails for this
            // context.
            else break;
        }

        // If the query has failed, then recursively descend the tree,
        // breadth-first, and retry the query with a different context.
        if ( descend ) {
            queue = [ this ];
            while ( subject = queue.shift() ) {
                substates = subject.substates( false, true );
                for ( i = 0, l = substates.length; i < l; i++ ) {
                    state = substates[i];

                    // The `ascend` block uses `descend` to indicate a substate
                    // that has already been searched.
                    if ( state === descend ) continue;

                    result = state.query( selector, against, false, false,
                        false );

                    if ( result ) return result;

                    queue.push( state );
                }
            }
        }

        // If the query still hasn’t succeeded, then recursively ascend the
        // tree and retry, but also passing `this` as a domain to be skipped
        // during the superstate’s subsequent descent.
        if ( ascend && ( superstate = this.superstate() ) ) {
            result = superstate.query( selector, against, descend && this,
                true, false );
            if ( result ) return result;
        }

        // If the query still hasn’t succeeded, then retry the query on the
        // protostate.
        if ( viaProto && ( protostate = this.protostate() ) ) {
            result = protostate.query( selector, against, descend, ascend,
                true );
            if ( result ) return result;
        }

        // All possibilities exhausted; no matches exist.
        return against ? false : null;
    },

    // #### [$](#state--prototype--dollarsign)
    // 
    // Convenience method that either aliases to
    // [`change`](#state--prototype--change) if passed a function for the first
    // argument, or aliases to [`query`](#state--prototype--query) if passed a
    // string — thereby mimicking the behavior of the object’s accessor method.
    // 
    // > See also:
    // [`StateController createAccessor`](#state-controller--private--create-accessor)
    $: function ( expr ) {
        var args, match, method;
        if ( typeof expr === 'function' ) {
            args = O.slice.call( arguments );
            args[0] = expr = expr();
            if ( expr ) return this.change.apply( this, args );
        }
        else if ( typeof expr === 'string' &&
            ( match = expr.match( rxTransitionArrow ) ) &&
            ( method = transitionArrowMethods[ match[1] ] )
        ) {
            if ( arguments.length > 1 ) {
                return this[ method ].apply( this, [ match[2] ]
                    .concat( O.slice.call( arguments, 1 ) ) );
            } else return this[ method ]( match[2] );
        }
        else return this.query.apply( this, arguments );
    }
});

// ### [`state/data.js`](#state--data.js)

O.assign( State.privileged, {

    // #### [data](#state--privileged--data)
    // 
    // Either retrieves or edits a block of data associated with this state.
    // 
    // If called with no arguments, or with boolean arguments, `data` returns
    // a copy of the data attached to this state, including all data from
    // inherited states, unless specified otherwise by the inheritance flags
    // `viaSuper` and `viaProto`.
    //
    // If called with an object-typed argument, `data` edits the data held on
    // this state. For keys in `edit` whose values are set to the `NIL`
    // directive, the matching keys in the state’s data are deleted. If the
    // operation results in a change to the state’s data, a
    // [`mutate`](/api/#state--attributes--mutate) event is emitted for this
    // state.
    //
    // > [Data](/docs/#concepts--data)
    // > [data](/api/#state--methods--data)
    data: function (
        /*Number*/ attributes,
        /*Object*/ data
    ) {
        return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
            var edit, delta, state, superstate, protostate;

            if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                edit = viaSuper; viaSuper = viaProto = false;
            } else {
                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );
            }

            if ( edit && attributes & MUTABLE && !O.isEmpty( edit ) ) {
                if ( attributes & VIRTUAL ) {
                    return this.realize().data( edit );
                }
                
                delta = O.delta( data, edit );
                if ( !this.__atomic__ && delta && !O.isEmpty( delta ) ) {
                    this.emit( 'mutate', [ edit, delta ], false );
                }

                return this;
            }
            else {
                return O.clone(
                    viaSuper && ( superstate = this.superstate() ) &&
                        superstate.data(),
                    viaProto && ( protostate = this.protostate() ) &&
                        protostate.data( false ),
                    data
                );
            }
        };
    }
});

State.prototype.data = State.privileged.data( undefined, null );

// ### [`state/methods.js`](#state--methods.js)

function rootNoop () {}

O.assign( State.privileged, {

    // #### [method](#state--privileged--method)
    // 
    // Retrieves the named method held on this state. If no method is found,
    // step through this state’s protostate chain to find one. If no method is
    // found there, step up the superstate hierarchy and repeat the search.
    //
    // > [method](/api/#state--methods--method)
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

            if ( method && method !== rootNoop ) {
                if ( out ) {
                    out.context = this; out.method = method;
                }
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
                    method = superstate.method( methodName, true, viaProto,
                        out );
                    if ( method ) return method;
                }
            }

            if ( out ) {
                out.context = null; out.method = method;
            }
            
            return method;
        };
    },

    // #### [methodNames](#state--privileged--method-names)
    // 
    // Returns an `Array` of names of methods defined for this state.
    //
    // > [methodNames](/api/#state--methods--method-names)
    methodNames: function ( methods ) {
        return function () {
            return O.keys( methods );
        };
    },

    // #### [addMethod](#state--privileged--add-method)
    // 
    // Adds a method to this state, which will be callable directly from the
    // owner, but with its context bound to the state.
    //
    // > [addMethod](/api/#state--methods--add-method)
    addMethod: function ( methods ) {

        // ##### createDelegator
        // 
        // Creates a function that will serve as a **delegator** method on an
        // owner object. For each method defined in any of the owner’s states,
        // a delegator must be created and assigned on the owner itself, at
        // the `methodName` key. This delegator then forwards any calls to
        // `methodName` to the owner’s current state, which will locate the
        // appropriate implementation for the method, apply it, and return the
        // result.
        // 
        // If an owner already has an implementation for a delegated method,
        // it is copied into the owner’s root state, such that it remains
        // accessible as the owner’s “default behavior” if none of its active
        // states contains an implementation for that method.
        // 
        // Stateful methods are applied in the context of the [`State`](#state)
        // to which they belong, or, if a method is inherited from a
        // protostate, the context will be the corresponding virtual state
        // within the local [`StateController`](#state-controller). However,
        // for any a priori methods relocated to the root state, the context
        // appropriately remains bound to the owner object.
        //
        // > [Delegator methods](/docs/#concepts--methods--delegators)
        function createDelegator ( accessorKey, methodName, original ) {
            function delegator () {
                return this[ accessorKey ]().apply( methodName, arguments );
            }

            delegator.isDelegator = true;
            if ( O.env.debug ) {
                delegator.toString = function () { return "[delegator]"; };
            }

            original && ( delegator.original = original );

            return delegator;
        }

        //
        return function (
              /*String*/ methodName,
            /*Function*/ fn,
             /*Boolean*/ raw  // optional
        ) {
            var controller = this.controller(),
                controllerName = controller.name(),
                root = controller.root(),
                owner = controller.owner(),
                ownerMethod;

            // If `fn` holds a lexical state method then extract the method.
            if ( !raw && fn.isLexicalStateMethodFactory ) {
                fn = fn.call( __MODULE__, this );
            }

            // If there is not already a method called `methodName` in the
            // state hierarchy, then the owner and controller need to be set up
            // properly to accommodate calls to this method.
            if ( !this.method( methodName, true, false ) ) {
                if ( this !== root &&
                    !root.method( methodName, false, false )
                ) {
                    ownerMethod = owner[ methodName ];
                    ( ownerMethod === undefined || ownerMethod.isDelegator ) &&
                        ( ownerMethod = rootNoop );

                    // The owner method must be added to the root state in its
                    // “raw” form, i.e., not lexically transformed by
                    // `state.method`.
                    root.addMethod( methodName, ownerMethod, true );
                }

                // A delegator function is instated on the owner, which will
                // direct subsequent calls to `owner[ methodName ]` to the
                // controller, and then on to the appropriate state’s
                // implementation.
                owner[ methodName ] =
                    createDelegator( controllerName, methodName, ownerMethod );
            }

            return methods[ methodName ] = fn;
        };
    },

    // #### [removeMethod](#state--privileged--remove-method)
    // 
    // Dissociates the named method from this state object and returns its
    // function.
    //
    // > [removeMethod](/api/#state--methods--remove-method)
    removeMethod: function ( methods ) {
        return function ( /*String*/ methodName ) {
            var fn = methods[ methodName ];
            delete methods[ methodName ];
            return fn;
        };
    }
});

O.assign( State.prototype, {
    method: State.privileged.method( null ),
    methodNames: function () { return []; },
    'addMethod removeMethod': O.noop,

    // #### [hasMethod](#state--prototype--has-method)
    // 
    // Determines whether `this` possesses or inherits a method named
    // `methodName`.
    //
    // > [hasMethod](/api/#state--methods--has-method)
    hasMethod: function ( /*String*/ methodName ) {
        var method = this.method( methodName );
        return method && method !== rootNoop;
    },

    // #### [hasOwnMethod](#state--prototype--has-own-method)
    // 
    // Determines whether `this` directly possesses a method named `methodName`.
    //
    // > [hasOwnMethod](/api/#state--methods--has-own-method)
    hasOwnMethod: function ( /*String*/ methodName ) {
        return !!this.method( methodName, false, false );
    },

    // #### [apply](#state--prototype--apply)
    // 
    // Finds a state method and applies it in the appropriate context. If the
    // method was originally defined in the owner, the context will be the
    // owner. Otherwise, the context will either be the state in which the
    // method is defined, or if the implementation resides in a protostate, the
    // corresponding state belonging to the inheriting owner. If the named
    // method does not exist locally and cannot be inherited, a `noSuchMethod`
    // event is emitted and the call returns `undefined`.
    //
    // > [apply](/api/#state--methods--apply)
    apply: function (
        /*String*/ methodName,
         /*Array*/ args         // optional
    ) {
        var out, method, context, owner, ownerMethod;

        out = { method: undefined, context: undefined };
        method = this.method( methodName, true, true, out );

        if ( !method ) {
            // Observers may listen for either a general `noSuchMethod` event,
            // or one that is specific to a particular method.
            this.emit( 'noSuchMethod', [ methodName, args ] );
            this.emit( 'noSuchMethod:' + methodName, args );
            return;
        }

        context = out.context;
        owner = this.owner();
        ownerMethod = owner[ methodName ];
        if ( ownerMethod && ownerMethod.original && context === this.root() ) {
            context = owner;
        }

        return method.apply( context, args );
    },

    // #### [call](#state--prototype--call)
    // 
    // Variadic [`apply`](#state--prototype--apply).
    //
    // > [call](/api/#state--methods--call)
    call: function ( /*String*/ methodName ) {
        return this.apply( methodName, O.slice.call( arguments, 1 ) );
    }
});

// ### [`state/events.js`](#state--events.js)

O.assign( State.privileged, {

    // #### [event](#state--privileged--event)
    // 
    // Returns a registered event listener, or the number of listeners
    // registered, for a given event `type`.
    // 
    // If an `id` as returned by [`addEvent`](#state--privileged--add-event) is
    // provided, the event listener associated with that `id` is returned. If no
    // `id` is provided, the number of event listeners registered to `type` is
    // returned.
    //
    // > [event](/api/#state--methods--event)
    event: function ( events ) {
        return function (
                    /*String*/ eventType,
         /*String | Function*/ id
        ) {
            var emitter = events[ eventType ];

            if ( emitter == null ) return;
            if ( id === undefined ) return emitter.length;

            typeof id === 'function' && ( id = emitter.key( id ) );
            return emitter.get( id );
        };
    },

    // #### [addEvent](#state--privileged--add-event)
    // 
    // Binds an event listener to the specified `eventType` and returns a unique
    // identifier for the listener. Built-in event types are listed at
    // `STATE_EVENT_TYPES`.
    // 
    // *Aliases:* **on**, **bind**
    //
    // > [addEvent](/api/#state--methods--add-event)
    addEvent: function ( events ) {
        return function (
              /*String*/ eventType,
            /*Function*/ fn,
              /*Object*/ context    // = this
        ) {
            if ( !O.hasOwn.call( events, eventType ) ) {
                events[ eventType ] = new StateEventEmitter( this, eventType );
            }

            return events[ eventType ].add( fn, context );
        };
    },

    // #### [removeEvent](#state--privileged--remove-event)
    // 
    // Unbinds the event listener with the specified `id` that was supplied by
    // [`addEvent`](#state--privileged--add-event).
    // 
    // *Aliases:* **off**, **unbind**
    //
    // > [removeEvent](/api/#state--methods--remove-event)
    removeEvent: function ( events ) {
        return function ( /*String*/ eventType, /*String*/ id ) {
            return events[ eventType ].remove( id );
        };
    },

    // #### [emit](#state--privileged--emit)
    // 
    // Invokes all listeners bound to the given event type.
    //
    // Arguments for the listeners can be passed as an array to the `args`
    // parameter.
    // 
    // Callbacks are invoked in the context of `this`, or as specified by
    // `context`.
    // 
    // Callbacks bound to superstates and protostates are also invoked, unless
    // otherwise directed by setting `viaSuper` or `viaProto` to `false`.
    // 
    // *Alias:* **trigger**
    //
    // > [emit](/api/#state--methods--emit)
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

            if ( typeof args === 'boolean' ) {
                viaProto = viaSuper;
                viaSuper = context;
                context = args;
                args = undefined;
            }
            if ( typeof context === 'boolean' ) {
                viaProto = viaSuper;
                viaSuper = context;
                context = undefined;
            }

            !args && ( args = [] ) || O.isArray( args ) || ( args = [ args ] );
            viaSuper === undefined && ( viaSuper = true );
            viaProto === undefined && ( viaProto = true );

            ( e = events[ eventType ] ) && e.emit( args, context || this );

            viaProto && ( protostate = this.protostate() ) &&
                protostate.emit( eventType, args, context || this, false );

            viaSuper && ( superstate = this.superstate() ) &&
                superstate.emit( eventType, args, context || superstate );
        };
    }
});

O.assign( State.prototype, {
    'event addEvent removeEvent emit trigger': O.noop
});

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

// ### [`state/substates.js`](#state--substates.js)

O.assign( State.privileged, {

    // #### [substate](#state--privileged--substate)
    // 
    // Retrieves the named substate of `this` state. If no such substate
    // exists in the local state, any identically named substate held on a
    // protostate will be returned.
    //
    // > [substate](/api/#state--methods--substate)
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

    // #### [substates](#state--privileged--substates)
    // 
    // Returns an `Array` of this state’s substates. If the boolean `deep`
    // argument is `true`, returns a depth-first flattened array containing all
    // of this state’s descendant states.
    //
    // > [substates](/api/#state--methods--substates)
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
            for ( key in substates ) if ( O.hasOwn.call( substates, key ) ) {
                result.push( substates[ key ] );
                if ( deep ) {
                    result = result.concat( substates[ key ].substates( true ) );
                }
            }

            return result;
        };
    },

    // #### [addSubstate](#state--privileged--add-substate)
    // 
    // Creates a state from the supplied `stateExpression` and adds it as a
    // substate of this state. If a substate with the same `stateName` already
    // exists, it is first destroyed and then replaced. If the new substate is
    // being added to the controller’s root state, a reference is added
    // directly on the controller itself as well.
    //
    // > [addSubstate](/api/#state--methods--add-substate)
    addSubstate: function ( attributes, substates ) {
        return function (
                                      /*String*/ stateName,
            /*StateExpression | Object | State*/ stateExpression
        ) {
            var substate, controller;

            if ( attributes & VIRTUAL ) {
                return this.realize().addSubstate( stateName, stateExpression );
            }

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

    // #### [removeSubstate](#state--privileged--remove-substate)
    // 
    // Removes the named substate from the local state, if possible.
    //
    // > [removeSubstate](/api/#state--methods--remove-substate)
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

O.privilege( State.prototype, State.privileged, {
    'substate substates': [ null ]
});
O.assign( State.prototype, {
    'addSubstate removeSubstate': O.noop
});

// ### [`state/transitions.js`](#state--transitions.js)

O.assign( State.privileged, {

    // #### [transition](#state--privileged--transition)
    // 
    // Returns the named transition expression held on this state.
    //
    // > [transition](/api/#state--methods--transition)
    transition: function ( transitions ) {
        return function ( /*String*/ transitionName ) {
            return transitions[ transitionName ];
        };
    },

    // #### [transitions](#state--privileged--transitions)
    // 
    // Returns an object containing all of the transition expressions defined
    // on this state.
    //
    // > [transitions](/api/#state--methods--transitions)
    transitions: function ( transitions ) {
        return function () {
            return O.clone( transitions );
        };
    },

    // #### [addTransition](#state--privileged--add-transition)
    // 
    // Registers a transition expression to this state.
    //
    // > [addTransition](/api/#state--methods--add-transition)
    addTransition: function ( transitions ) {
        return function (
                                   /*String*/ name,
            /*TransitionExpression | Object*/ expression
        ) {
            expression instanceof TransitionExpression ||
                ( expression = new TransitionExpression( expression ) );

            return transitions[ name ] = expression;
        };
    },

    // #### [removeTransition](#state--privileged--remove-transition)
    // 
    // (Not implemented)
    removeTransition: O.noop
});

O.assign( State.prototype, {
    'transition addTransition removeTransition': O.noop,
    transitions: function () { return {}; }
});

// ### [`state/__post.js`](#state--__post.js)

return State;

}() );

// ## [StateExpression](#state-expression)
// 
// A **state expression** is a data structure that formalizes a definition of
// a state’s contents.
//
// States are declared by calling the module’s exported [`state()`](#module)
// function and passing it an object map containing the definition. This
// input may be expressed in a shorthand format, which the
// [`StateExpression`](#state-expression)
// [constructor](#state-expression--constructor) rewrites into unambiguous
// long form, which can be used later to create [`State`](#state) instances.
var StateExpression = ( function () {
    var attributeMap =
            O.forEach( O.assign( STATE_ATTRIBUTE_MODIFIERS ),
                function ( value, key, object ) {
                    object[ key ] = key.toUpperCase();
                }),

        attributeFlags =
            O.forEach( O.invert( STATE_ATTRIBUTES ),
                function ( value, key, object ) {
                    object[ key ] = value.toLowerCase();
                }),

        categoryMap    = O.assign( STATE_EXPRESSION_CATEGORIES ),
        eventTypes     = O.assign( STATE_EVENT_TYPES ),
        guardActions   = O.assign( GUARD_ACTIONS );

    // ### [Constructor](#state-expression--constructor)
    function StateExpression (
        /*String | Object*/ attributes, // optional
                 /*Object*/ map
    ) {
        if ( !( this instanceof StateExpression ) ) {
            return new StateExpression( attributes, map );
        }

        if ( typeof attributes === 'string' ) {
            if ( !map ) { map = {}; }
        } else {
            if ( !map ) { map = attributes; attributes = undefined; }
        }

        O.edit( 'deep all', this,
            map instanceof StateExpression ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            O.isNumber( attributes ) ||
                ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // ### [Class functions](#state-expression--class)

    // #### [encodeAttributes](#state-expression--class--encode-attributes)
    // 
    // Returns the bit-field integer represented by the provided set of
    // attributes.
    function encodeAttributes ( /*Object | String*/ attributes ) {
        var key,
            result = STATE_ATTRIBUTES.NORMAL;

        if ( typeof attributes === 'string' ) {
            attributes = O.assign( attributes );
        }

        for ( key in attributes ) if ( O.hasOwn.call( attributes, key ) ) {
            if ( key in attributeMap ) {
                result |= STATE_ATTRIBUTES[ attributeMap[ key ] ];
            }
        }

        return result;
    }
    StateExpression.encodeAttributes = encodeAttributes;

    // #### [decodeAttributes](#state-expression--class--decode-attributes)
    // 
    // Returns the space-delimited set of attribute names represented by the
    // provided bit-field integer.
    function decodeAttributes ( /*Number*/ attributes ) {
        var key, out = [];
        for ( key in attributeFlags ) {
            attributes & key && out.push( attributeFlags[ key ] );
        }
        return out.join(' ');
    }
    StateExpression.decodeAttributes = decodeAttributes;

    // ### [Class-private functions](#state-expression--private)

    // #### [interpret](#state-expression--private--interpret)
    // 
    // Transforms a plain object map into a well-formed
    // [`StateExpression`](#state-expression), making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category, item,
            result = O.assign( STATE_EXPRESSION_CATEGORIES, null );

        // Interpret and categorize the elements of the provided `map`.
        for ( key in map ) if ( O.hasOwn.call( map, key ) ) {
            value = map[ key ];

            // If `value` is just a reference to the exported `state` function,
            // interpret this as an empty state.
            value === state && ( value = new StateExpression );

            // **Priority 1:** Do a nominative type match for explicit
            // expression instances.
            category =
                value instanceof StateExpression && 'states' ||
                value instanceof TransitionExpression && 'transitions';
            if ( category ) {
                item = result[ category ];
                item || ( item = result[ category ] = {} );
                item[ key ] = value;
            }

            // **Priority 2:** Recognize an explicitly named category object.
            else if ( key in result && value ) {
                result[ key ] = O.clone( result[ key ], value );
            }

            // **Priority 3:** Use keys and value types to infer implicit
            // categorization.
            else {
                category =
                    key in eventTypes || typeof value === 'string' ?
                        'events' :
                    key in guardActions ?
                        'guards' :
                    O.isPlainObject( value ) ?
                        'states' :
                    O.isFunction( value ) ?
                        'methods' :
                    undefined;

                if ( category ) {
                    item = result[ category ];
                    item || ( item = result[ category ] = {} );
                    item[ key ] = value;
                }
            }
        }

        // Coerce the extracted values as necessary:

        // Event values are coerced into an array.
        object = result.events;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( typeof value === 'function' || typeof value === 'string' ) {
                object[ key ] = [ value ];
            }
        }

        // Guards are represented as a hashmap keyed by selector, so non-object
        // values are coerced into a single-element object with the value keyed
        // to the wildcard selector.
        object = result.guards;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !O.isPlainObject( value ) ) {
                object[ key ] = { '*': value };
            }
        }

        // Transition values must be a
        // [`TransitionExpression`](#transition-expression).
        object = result.transitions;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !( value instanceof TransitionExpression ) ) {
                object[ key ] = new TransitionExpression( value );
            }
        }

        // State values must be a [`StateExpression`](#state-expression).
        object = result.states;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !( value instanceof StateExpression ) ) {
                object[ key ] = new StateExpression( value );
            }
        }

        return result;
    }

    return StateExpression;
}() );

// ## [StateController](#state-controller)
// 
// A **state controller** maintains the identity of the owner’s **current
// state**, and facilitates transitions from one state to another. It provides
// the behavior-modeling aspect of the owner’s state by forwarding method calls
// made on the owner to any associated stateful implementations of those
// methods that are valid given the current state.
var StateController = ( function () {

    // ### [Constructor](#state-controller--constructor)
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
            typeof options === 'string' &&
                ( options = { initialState: options } );

        // Assign to `owner` an
        // [accessor method](#state-controller--private--create-accessor)
        // that will serve as the owner’s interface into its state.
        name = options.name || 'state';
        owner[ name ] = createAccessor( owner, name, this );

        O.assign( this, {
            // #### [owner](#state-controller--constructor--owner)
            // 
            // Returns the owner object on whose behalf this controller acts.
            owner: O.thunk( owner ),

            // #### [name](#state-controller--constructor--name)
            // 
            // Returns the name assigned to this controller. This is also the
            // key in `owner` that holds the `accessor` function associated
            // with this controller.
            name: O.stringFunction( function () { return name; } ),

            // #### [current](#state-controller--constructor--current)
            // 
            // Returns the controller’s current state, or currently active
            // transition.
            current: O.assign( function () { return current; }, {
                toString: function () {
                    if ( current ) return current.toString();
                }
            }),

            // #### [change](#state-controller--constructor--change)
            // 
            // *See* [`StateController.privileged.change`](#state-controller--privileged--change)
            change: StateController.privileged.change(
                setCurrent, setTransition ),

            // #### [transition](#state-controller--constructor--transition)
            // 
            // Returns the currently active transition, or `undefined` if the
            // controller is not presently engaged in a transition.
            transition: O.assign( function () { return transition; }, {
                toString: function () {
                    if ( transition ) return transition.toString();
                }
            }),

            // #### [destroy](#state-controller--constructor--destroy)
            // 
            // Destroys this controller and all of its states, and returns the
            // owner to its original condition.
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

        // Instantiate the root state, adding a redefinition of the
        // `controller` method that points directly to this controller, along
        // with all of the members and substates outlined in `expression`.
        root = new State( this, '', expression );

        // Establish which state should be the initial state and set the
        // current state to that.
        current = root.initialSubstate() || root;
        if ( options.initialState !== undefined ) {
            current = root.query( options.initialState );
        }
        if ( current.isAbstract() ) {
            defaultSubstate = current.defaultSubstate();
            if ( defaultSubstate ) {
                current = defaultSubstate;
            }
        }
        if ( current.controller() !== this ) {
            current = virtualize.call( this, current );
        }

        // (Exposed for debugging.)
        O.env.debug && O.assign( this.__private__ = {}, {
            root: root,
            owner: owner,
            options: options
        });
    }

    // ### Class-private functions

    // #### [createAccessor](#state-controller--private--create-accessor)
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
                new StateController( this, null, {
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

    // #### [virtualize](#state-controller--private--virtualize)
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

    // #### [evaluateGuard](#state-controller--private--evaluate-guard)
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

    // ### [External privileged methods](#state-controller--privileged)
    StateController.privileged = {

        // #### [change](#state-controller--privileged--change)
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
        change: function ( setCurrent, setTransition ) {
            var defaultOptions = {};

            return function (
                /*State | String*/ target,
                        /*Object*/ options // optional
            ) {
                var owner, transition, targetOwner, source, origin, domain,
                    state, record, transitionExpression,
                    self = this;

                owner = this.owner();
                transition = this.transition();

                // The `origin` is defined as the controller’s most recently
                // current state that is not a `Transition`.
                origin = transition ? transition.origin() : this.current();

                // Departures are not allowed from a state that is `final`.
                if ( origin.isFinal() ) return null;

                // Ensure that `target` is a valid [`State`](#state).
                target instanceof State ||
                    ( target = target ? origin.query( target ) : this.root() );
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

                // If any guards are in place for the given `origin` and
                // `target` states, they must consent to the transition.
                if ( !options.forced && (
                        !evaluateGuard.call( origin, 'release', target ) ||
                        !evaluateGuard.call( target, 'admit', origin )
                ) ) {
                    if ( typeof options.failure === 'function' ) {
                        options.failure.call( this );
                    }
                    return null;
                }

                // If `target` is a protostate, i.e. a state from a prototype
                // of `owner`, then it must be represented within `owner` as a
                // transient virtual state that inherits from the protostate.
                target && target.controller() !== this &&
                    ( target = virtualize.call( this, target ) );

                // The `source` variable will reference the previously current
                // state (or abortive transition).
                source = this.current();

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

                // Retrieve the appropriate transition expression for this
                // origin/target pairing; if none is defined, then an
                // actionless default transition will be created and applied,
                // causing the callback to return immediately.
                transitionExpression =
                    this.getTransitionExpressionFor( target, origin );
                transition =
                    new Transition( target, source, transitionExpression );
                setTransition( transition );

                // Preparation for the transition begins by emitting a `depart`
                // event on the `source` state.
                source.emit( 'depart', transition, false );
                transition.wasAborted() && ( transition = null );

                // Enter into the transition state.
                if ( transition ) {
                    setCurrent( transition );
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

                // A scoped callback will be called from `transition.end()` to
                // conclude the transition.
                transition && transition.setCallback( function () {
                    var state, pathToState, substate, superstate;

                    transition.wasAborted() && ( transition = null );

                    // Trace a path from `target` up to `domain`, then walk
                    // down it, emitting `enter` events for each state along
                    // the way.
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
                        setCurrent( target );
                        target.emit( 'arrive', transition, false );

                        // Any virtual states that were previously active are
                        // no longer needed.
                        for ( state = origin;
                              state.isVirtual();
                              state = superstate
                        ) {
                            superstate = state.superstate();
                            state.destroy();
                        }

                        // Now complete, the [`Transition`](#transition)
                        // instance can be discarded.
                        transition.destroy();
                        transition = setTransition( null );

                        if ( typeof options.success === 'function' ) {
                            options.success.call( this );
                        }

                        return target;
                    }

                    return null;
                });

                // At this point the transition is attached to the `domain`
                // state and is ready to proceed.
                return transition &&
                    transition.start.apply( transition, options.args ) ||
                    this.current();
            };
        }
    };

    // ### [Prototype methods](#state-controller--prototype)
    O.assign( StateController.prototype, {

        // #### [toString](#state-controller--prototype--to-string)
        // 
        toString: function () {
            return this.current().toString();
        },

        // #### [getTransitionExpressionFor](#state-controller--prototype--get-transition-expression-for)
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
// ## [StateEventEmitter](#state-event-emitter)
// 
// A state holds event listeners for a given event type in a `StateEventEmitter`
// instance.
// 
// An event listener is usually a function, but may also be held as a string,
// which, when the client state [`emit`](#state--privileged--emit)s
// the event type associated with this emitter, will be interpreted as an
// implicit order for the emitting state to [`change`](#state--prototype--change)
// to the target state named by the string.
var StateEventEmitter = ( function () {
    var guid = 0;

    // ### [Constructor](#state-event-emitter)
    function StateEventEmitter ( state, type ) {
        this.state = state;
        this.type = type;
        this.items = {};
        this.length = 0;
    }

    // ### [Prototype methods](#state-event-emitter--prototype)
    O.assign( StateEventEmitter.prototype, {

        // #### [guid](#state-event-emitter--prototype--guid)
        // 
        // Produces a unique numeric string, to be used as a key for bound
        // event listeners.
        guid: function () {
            return ( guid += 1 ).toString();
        },

        // #### [get](#state-event-emitter--prototype--get)
        // 
        // Retrieves a bound listener associated with the provided `id` string
        // as returned by the prior call to
        // [`add`](#state-event-emitter--prototype--add).
        get: function ( /*String*/ id ) {
            return this.items[ id ];
        },

        // #### [getAll](#state-event-emitter--prototype--get-all)
        // 
        // Returns an array of all bound listeners.
        getAll: function () {
            var i, items = this.items, result = [];
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // #### [set](#state-event-emitter--prototype--set)
        // 
        // Adds or replaces a handler bound to a specific key.
        set: function (
                       /*String*/ id,
            /*Function | String*/ handler
        ) {
            var items = this.items;
            O.hasOwn.call( items, id ) || this.length++;
            items[ id ] = handler;
            return id;
        },

        // #### [key](#state-event-emitter--prototype--key)
        // 
        // Retrieves the `id` string associated with the provided listener.
        key: function ( /*Function*/ listener ) {
            var i, items = this.items;
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                if ( items[i] === listener ) return i;
            }
        },

        // #### [keys](#state-event-emitter--prototype--keys)
        // 
        // Returns the set of `id` strings associated with all bound listeners.
        keys: function () {
            var i, items = this.items, result = [];

            result.toString = function () { return '[' + result.join() + ']'; };
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                result.push( items[i] );
            }
            return result;
        },

        // #### [add](#state-event-emitter--prototype--add)
        // 
        // Binds a listener, along with an optional context object, to be
        // called when the the emitter
        // [`emit`](#state-event-emitter--prototype--emit)s an event.
        // Returns a unique key that can be used later to
        // [`remove`](#state-event-emitter--prototype--remove) the listener.
        // 
        // *Aliases:* **on bind**
        'add on bind': function (
            /*Function*/ fn,
              /*Object*/ context  // optional
        ) {
            var id = this.guid();
            this.items[ id ] =
                typeof context === 'object' ? [ fn, context ] : fn;
            this.length++;
            return id;
        },

        // #### [remove](#state-event-emitter--prototype--remove)
        // 
        // Unbinds a listener. Accepts either the numeric string returned by
        // [`add`](#state-event-emitter--prototype--add) or a reference to
        // the function itself.
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

        // #### [empty](#state-event-emitter--prototype--empty)
        // 
        // Removes all listeners, and returns the number of listeners removed.
        empty: function () {
            var n = this.length, items, i;

            if ( n === 0 ) return 0;

            items = this.items;
            for ( i in items ) if ( O.hasOwn.call( items, i ) ) delete items[i];
            this.length = 0;
            return n;
        },

        // #### [emit](#state-event-emitter--prototype--emit)
        // 
        // Invokes all bound listeners, with the provided array of `args`, and
        // in the context of the bound or provided `state`.
        // 
        // *Alias:* **trigger**
        'emit trigger': function (
            /*Array*/ args,  // optional
            /*State*/ state  // = this
        ) {
            var i, item, itemType, fn, context, target,
                items = this.items, type = this.type;

            state || ( state = this.state );

            for ( i in items ) if ( O.hasOwn.call( items, i ) ) {
                item = items[i];
                itemType = O.type( item );

                if ( itemType === 'function' ) {
                    fn = item; context = state;
                }
                else if ( itemType === 'array' ) {
                    fn = item[0]; context = item[1];
                }

                // If `item` is a string or [`State`](#state), interpret this
                // as an implied transition to be instigated from the client
                // `State` after all the callbacks have been invoked.
                else if ( itemType === 'string' || item instanceof State ) {
                    target = item;
                    continue;
                }

                fn.apply( context, args );
                fn = context = null;
            }

            target && state.change( target );
        },

        // #### [destroy](#state-event-emitter--prototype--destroy)
        // 
        destroy: function () {
            this.empty();
            delete this.state; delete this.items;
            return true;
        }
    });

    return StateEventEmitter;
}() );

// ## [Transition](#transition)
// 
// A `Transition` is a transient `State` adopted by a controller as it changes
// from one of its proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor*
// between its **origin** and **target** states. During this time it behaves as
// if it were a substate of that domain state, inheriting method calls and
// propagating events in the familiar fashion.
//
// > [Transitions](/docs/#concepts--transitions)
// > [Transition](/api/#transition)
var Transition = ( function () {
    O.inherit( Transition, State );

    // ### [Constructor](#transition--constructor)
    function Transition ( target, source, expression, callback ) {
        if ( !( this instanceof Transition ) ) {
            return TransitionExpression.apply( this, arguments );
        }

        var self = this,
            name = expression && expression.name || '',

            methods = {},
            events = {},
            guards = {},

            // The **action** of a transition is a function that will be called
            // after the transition has been `start`ed. This function, if
            // provided, is responsible for calling `end()` on the transition
            // at some point in the future.
            action = expression && expression.action || null,

            attachment = source,
            controller, aborted;

        controller = source.controller();
        if ( controller !== target.controller() ) {
            controller = undefined;
        }

        // (Exposed for debugging.)
        O.env.debug && O.assign( this.__private__ = {}, {
            methods: methods,
            events: events,
            guards: guards,
            action: action
        });

        O.assign( this, {
            // #### [name](#transition--constructor--name)
            name: function () {
                return name;
            },

            // #### [superstate](#transition--constructor--superstate)
            // 
            // A [`Transition`](#transition) instance uses `superstate` to
            // track its position as it traverses the [`State`](#state) subtree
            // that defines its domain.
            //
            // > [superstate](/api/#transition--methods--superstate)
            superstate: function () {
                return attachment;
            },

            // #### [attachTo](#transition--constructor--attach-to)
            attachTo: function ( superstate ) {
                return attachment = superstate;
            },

            // #### [controller](#transition--constructor--controller)
            controller: function () {
                return controller;
            },

            // #### [origin](#transition--constructor--origin)
            // 
            // A transition’s **origin** is the controller’s most recently
            // active [`State`](#state) that is not itself a
            // [`Transition`](#transition).
            //
            // > [origin](/api/#transition--methods--origin)
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // #### [source](#transition--constructor--source)
            // 
            // A transition’s **source** is the [`State`](#state) or
            // [`Transition`](#transition) that immediately preceded `this`.
            //
            // > [source](/api/#transition--methods--source)
            source: function () {
                return source;
            },

            // #### [target](#transition--constructor--target)
            // 
            // The intended destination [`State`](#state) for this transition.
            // If a target is invalidated by a controller that
            // [`change`](#state-controller--privileged--change)s state again
            // before this transition completes, then this transition is
            // aborted and the `change` call will create a new transition with
            // `this` as its `source`.
            //
            // > [target](/api/#transition--methods--target)
            target: function () {
                return target;
            },

            // #### [setCallback](#transition--constructor--set-callback)
            // 
            // Allows the callback function to be set or changed prior to the
            // transition’s completion.
            setCallback: function ( fn ) {
                return callback = fn;
            },

            // #### [wasAborted](#transition--constructor--was-aborted)
            //
            // > [wasAborted](/api/#transition--methods--was-aborted)
            wasAborted: function () {
                return aborted;
            },

            // #### [start](#transition--constructor--start)
            // 
            // Starts the transition; if an `action` is defined, that function
            // is responsible for declaring an end to the transition by calling
            // [`end()`](#transitions--constructor--end). Otherwise, the
            // transition is necessarily synchronous and is concluded
            // immediately.
            //
            // > [start](/api/#transition--methods--start)
            start: function () {
                aborted = false;
                this.emit( 'start', arguments, false );
                if ( action && O.isFunction( action ) ) {
                    action.apply( this, arguments );
                    return this;
                } else {
                    return this.end.apply( this, arguments );
                }
            },

            // #### [abort](#transition--constructor--abort)
            // 
            // Indicates that a transition won’t directly reach its target
            // state; for example, if a new transition is initiated while an
            // asynchronous transition is already underway, that previous
            // transition is aborted. The previous transition is retained as
            // the `source` for the new transition.
            abort: function () {
                aborted = true;
                callback = null;
                this.emit( 'abort', arguments, false );
                return this;
            },

            // #### [end](#transition--constructor--end)
            // 
            // Indicates that a transition has completed and has reached its
            // intended target. The transition is subsequently retired, along
            // with any preceding aborted transitions.
            //
            // > [end](/api/#transition--methods--end)
            end: function () {
                if ( !aborted ) {
                    this.emit( 'end', arguments, false );
                    callback && callback.apply( controller, arguments );
                }
                this.destroy();
                return target;
            },

            // #### [destroy](#transition--constructor--destroy)
            // 
            // Destroys this transition and clears its held references, and
            // does the same for any aborted `source` transitions that preceded
            // it.
            destroy: function () {
                source instanceof Transition && source.destroy();
                target = attachment = controller = null;
            }
        });

        // [`Transition`](#transition) also inherits certain privileged methods
        // from [`State`](#state), which it obtains by partially applying the
        // corresponding members of [`State.privileged`](#state--privileged).
        O.privilege( this, State.privileged, {
            'express mutate' : [ TransitionExpression, undefined, null,
                methods, events, guards ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        O.alias( this, {
            addEvent: 'on bind',
            removeEvent: 'off unbind',
            emit: 'trigger'
        });

        State.privileged.init( TransitionExpression ).call( this, expression );
    }

    // #### [depth](#transition--prototype--depth)
    // 
    Transition.prototype.depth = function () {
        var s = this.source(),
            count = 0;
        
        while ( s instanceof Transition ) {
            count++;
            s = s.source();
        }

        return count;
    };

    return Transition;
}() );
// ## [TransitionExpression](#transition-expression)
// 
// A [`State`](#state) may hold **transition expressions** that describe the
// transition that will take place between any two given **origin** and
// **target** states.

var TransitionExpression = ( function () {
    var properties   = O.assign( TRANSITION_PROPERTIES, null ),
        categories   = O.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = O.assign( TRANSITION_EVENT_TYPES ),
        guardActions = O.assign( GUARD_ACTIONS );

    // ### [Constructor](#transition-expression--constructor)
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        O.edit( 'deep all', this,
            map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // ### [Class-private functions](#transition-expression--private)

    // #### [interpret](#transition-expression--private--interpret)
    // 
    // Rewrites a plain object map as a well-formed
    // [`TransitionExpression`](#transition-expression), making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var key, value, category, events, item,
            result = O.assign( {}, properties, categories );

        for ( key in map ) if ( O.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                result[ key ] = O.clone( result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ?
                        'events' :
                    key in guardActions ?
                        'guards' :
                    O.isFunction( value ) ?
                        'methods' :
                    undefined;

                if ( category ) {
                    item = result[ category ];
                    item || ( item = result[ category ] = {} );
                    item[ key ] = value;
                }
            }
        }
        for ( key in ( events = result.events ) ) {
            value = events[ key ];
            if ( O.isFunction( value ) ) {
                events[ key ] = [ value ];
            }
        }

        return result;
    }

    return TransitionExpression;
}() );

// Classes are made available as members of the exported module.
O.assign( state, {
    State: State,
    StateExpression: StateExpression,
    StateController: StateController,
    StateEventEmitter: StateEventEmitter,
    Transition: Transition,
    TransitionExpression: TransitionExpression
});

}.call( this ) );
