// ### Transitions
//
Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--transitions--transition"
    //    href="#state--transitions--transition"></a>
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
    //    name="state--transitions--transitions"
    //    href="#state--transitions--transitions"></a>
    // 
    // #### transitions
    // 
    // Returns an object containing all of the transition expressions defined
    // on this state.
    transitions: function ( transitions ) {
        return function () {
            return Z.clone( transitions );
        };
    },

    // <a class="icon-link"
    //    name="state--transitions--add-transition"
    //    href="#state--transitions--add-transition"></a>
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
                ( expression = TransitionExpression( expression ) );

            return transitions[ name ] = expression;
        };
    },

    // <a class="icon-link"
    //    name="state--transitions--remove-transition"
    //    href="#state--transitions--remove-transition"></a>
    // 
    // #### removeTransition
    // 
    // (Not implemented)
    removeTransition: Z.noop
});

Z.assign( State.prototype, {
    'transition addTransition removeTransition': Z.noop,
    transitions: function () { return {}; }
});
