// Copyright (C) 2011-2012 Nick Fargo, Z Vector Inc.
// 
// [`LICENSE`](https://github.com/nickfargo/state/blob/master/LICENSE) MIT.
// 
// **State** is a framework for implementing state-driven behavior directly
// into any JavaScript object.
// 
// [statejs.org](/)
// [docs](/docs/)
// [api](/api/)
// [tests](/tests/)
// <a class="icon-invertocat" href="http://github.com/nickfargo/state"></a>

;( function ( undefined ) {

"use strict";

var global = this,

    meta = {
        VERSION: '0.0.6',

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


// Cached regular expressions.
var rxWhitespace            = /\s+/,
    rxComma                 = /,/,
    rxTrimmedCommaDelimiter = /\s*,+\s*/,
    rxWildcardsOnly         = /^\*+$/,
    rxDotsAndWildcardsOnly  = /^\.*\**$/,
    rxDotsOnlyMinusOne      = /^(\.+)\.$/,
    rxTransitionArrow       = /^\s*([\-|=]>)\s*(.*)/;

// Token mappings.
var transitionArrowMethods  = { '->': 'change', '=>': 'changeTo' };


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
