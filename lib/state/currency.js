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
