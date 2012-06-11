// ### Attributes
//
// Methods that query a state’s attributes.


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

Z.assign( State.prototype, {
    attributes: Z.thunk( NORMAL ),
    isVirtual:    function () { return !!( this.attributes() & VIRTUAL    ); },
    isMutable:    function () { return !!( this.attributes() & MUTABLE    ); },
    isFinite:     function () { return !!( this.attributes() & FINITE     ); },
    isImmutable:  function () { return !!( this.attributes() & IMMUTABLE  ); },
    isInitial:    function () { return !!( this.attributes() & INITIAL    ); },
    isConclusive: function () { return !!( this.attributes() & CONCLUSIVE ); },
    isFinal:      function () { return !!( this.attributes() & FINAL      ); },
    isAbstract:   function () { return !!( this.attributes() & ABSTRACT   ); },
    isDefault:    function () { return !!( this.attributes() & DEFAULT    ); },
    isSealed:     function () { return !!( this.attributes() & SEALED     ); },
    isRetained:   function () { return !!( this.attributes() & RETAINED   ); },
    hasHistory:   function () { return !!( this.attributes() & HISTORY    ); },
    isShallow:    function () { return !!( this.attributes() & SHALLOW    ); },
    isVersioned:  function () { return !!( this.attributes() & VERSIONED  ); },
    isConcurrent: function () { return !!( this.attributes() & CONCURRENT ); }
});