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
