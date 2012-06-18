// <a class="icon-link"
//    name="state--currency.js"
//    href="#state--currency.js"></a>
// 
// ### `state/currency.js`
// 
// Methods that inspect or change the owner’s current state.

Z.assign( State.prototype, {

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
    //    name="state--prototype--is-current"
    //    href="#state--prototype--is-current"></a>
    // 
    // #### isCurrent
    // 
    // Returns a `Boolean` indicating whether `this` is the owner’s current
    // state.
    isCurrent: function () {
        return this.current() === this;
    },

    // <a class="icon-link"
    //    name="state--prototype--is-active"
    //    href="#state--prototype--is-active"></a>
    // 
    // #### isActive
    // 
    // Returns a `Boolean` indicating whether `this` or one of its substates is
    // the owner’s current state.
    isActive: function () {
        var current = this.current();
        return current === this || this.isSuperstateOf( current );
    },

    // <a class="icon-link"
    //    name="state--prototype--change"
    //    href="#state--prototype--change"></a>
    // 
    // #### change
    // 
    // Forwards a `change` command to the state’s controller and returns its
    // result. Calling with no arguments directs the controller to change to
    // `this` state.
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
    }
});
