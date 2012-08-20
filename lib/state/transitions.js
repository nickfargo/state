// ### [`state/transitions.js`](#state--transitions.js)

O.assign( State.privileged, {

    // #### [transition](#state--privileged--transition)
    // 
    // Returns the named transition expression held on this state.
    //
    // > [transition](/api/#state--methods--transition)
    transition: function ( transitions ) {
        return function ( /*String*/ transitionName ) {
            return transitions[ transitionName ];
        };
    },

    // #### [transitions](#state--privileged--transitions)
    // 
    // Returns an object containing all of the transition expressions defined
    // on this state.
    //
    // > [transitions](/api/#state--methods--transitions)
    transitions: function ( transitions ) {
        return function () {
            return O.clone( transitions );
        };
    },

    // #### [addTransition](#state--privileged--add-transition)
    // 
    // Registers a transition expression to this state.
    //
    // > [addTransition](/api/#state--methods--add-transition)
    addTransition: function ( transitions ) {
        return function (
                                   /*String*/ name,
            /*TransitionExpression | Object*/ expression
        ) {
            expression instanceof TransitionExpression ||
                ( expression = new TransitionExpression( expression ) );

            return transitions[ name ] = expression;
        };
    },

    // #### [removeTransition](#state--privileged--remove-transition)
    // 
    // (Not implemented)
    removeTransition: O.noop
});

O.assign( State.prototype, {
    'transition addTransition removeTransition': O.noop,
    transitions: function () { return {}; }
});
