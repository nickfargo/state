// <a class="icon-link"
//    name="state--transitions.js"
//    href="#state--transitions.js"></a>
// 
// ### `state/transitions.js`

O.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--transition"
    //    href="#state--privileged--transition"></a>
    // 
    // #### transition
    // 
    // Returns the named transition expression held on this state.
    transition: function ( transitions ) {
        return function ( /*String*/ transitionName ) {
            return transitions[ transitionName ];
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--transitions"
    //    href="#state--privileged--transitions"></a>
    // 
    // #### transitions
    // 
    // Returns an object containing all of the transition expressions defined
    // on this state.
    transitions: function ( transitions ) {
        return function () {
            return O.clone( transitions );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--add-transition"
    //    href="#state--privileged--add-transition"></a>
    // 
    // #### addTransition
    // 
    // Registers a transition expression to this state.
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

    // <a class="icon-link"
    //    name="state--privileged--remove-transition"
    //    href="#state--privileged--remove-transition"></a>
    // 
    // #### removeTransition
    // 
    // (Not implemented)
    removeTransition: O.noop
});

O.assign( State.prototype, {
    'transition addTransition removeTransition': O.noop,
    transitions: function () { return {}; }
});
