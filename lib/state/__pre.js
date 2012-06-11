var State = ( function () {

var SA = STATE_ATTRIBUTES,
    
    NORMAL      = SA.NORMAL,
    VIRTUAL     = SA.VIRTUAL,
    MUTABLE     = SA.MUTABLE,
    FINITE      = SA.FINITE,
    IMMUTABLE   = SA.IMMUTABLE,
    INITIAL     = SA.INITIAL,
    CONCLUSIVE  = SA.CONCLUSIVE,
    FINAL       = SA.FINAL,
    ABSTRACT    = SA.ABSTRACT,
    DEFAULT     = SA.DEFAULT,
    SEALED      = SA.SEALED,
    HISTORY     = SA.HISTORY,
    RETAINED    = SA.RETAINED,
    SHALLOW     = SA.SHALLOW,
    CONCURRENT  = SA.CONCURRENT,

    PROTOSTATE_HERITABLE_ATTRIBUTES =
        MUTABLE    |  FINITE      |  IMMUTABLE  |
        INITIAL    |  CONCLUSIVE  |  FINAL      |
        ABSTRACT   |  DEFAULT     |  SEALED     |
        HISTORY    |  RETAINED    |  SHALLOW    |
        CONCURRENT
    ;

Z.assign( State, SA );
