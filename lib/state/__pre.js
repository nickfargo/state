// ## State <a class="icon-link" name="state" href="#state"></a>
// 
// A **state** models a set of behaviors on behalf of an owner object. The
// owner may undergo **transitions** that change its **current** state from
// one to another, and in so doing adopt a different set of behaviors.
// 
// Distinct behaviors are modeled in each state by defining a set of method
// overrides, to which calls made on the owner will be redirected so long as a
// state remains current.
// 
// States are structured as a rooted tree, where **substates** inherit from a
// single **superstate**. While a substate is current, it and all of its
// ancestor superstates are considered to be **active**.
// 
// In addition, a state also recognizes the owner object’s prototypal
// inheritance, identifying an identically named and positioned state in the
// prototype as its **protostate**. Stateful behavior is inherited *from
// protostates first*, then from superstates.

// <a class="icon-link"
//    name="state--__pre.js"
//    href="#state--__pre.js"></a>
// 
// ### `state/__pre.js`

var State = ( function () {

var SA = STATE_ATTRIBUTES,
    
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
    DEFAULT     = SA.DEFAULT,
    REFLECTIVE  = SA.REFLECTIVE,
    HISTORY     = SA.HISTORY,
    RETAINED    = SA.RETAINED,
    SHALLOW     = SA.SHALLOW,
    CONCURRENT  = SA.CONCURRENT,

    PROTOSTATE_HERITABLE_ATTRIBUTES =
        MUTABLE     |  FINITE      |  STATIC     |  IMMUTABLE  |
        INITIAL     |  CONCLUSIVE  |  FINAL      |
        ABSTRACT    |  DEFAULT     |
        REFLECTIVE  |
        HISTORY     |  RETAINED    |  SHALLOW    |
        CONCURRENT
    ;

Z.assign( State, SA );
