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
