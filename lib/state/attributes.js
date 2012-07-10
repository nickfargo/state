// <a class="icon-link"
//    name="state--attributes.js"
//    href="#state--attributes.js"></a>
// 
// ### `state/attributes.js`
//
// Methods that inspect a state’s attributes.


// <a class="icon-link"
//    name="state--privileged--attributes"
//    href="#state--privileged--attributes"></a>
// 
// #### attributes
// 
// Returns the bit-field representing the state’s attribute flags.
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
    isDefault:    function () { return !!( this.attributes() & DEFAULT    ); },
    isReflective: function () { return !!( this.attributes() & REFLECTIVE ); },
    hasHistory:   function () { return !!( this.attributes() & HISTORY    ); },
    isRetained:   function () { return !!( this.attributes() & RETAINED   ); },
    isShallow:    function () { return !!( this.attributes() & SHALLOW    ); },
    isConcurrent: function () { return !!( this.attributes() & CONCURRENT ); }
});
