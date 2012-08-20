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
