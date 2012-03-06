// Make the set of defined classes available as members of the exported module.
Z.assign( state, {
    State: State,
    StateExpression: StateExpression,
    StateController: StateController,
    StateEvent: StateEvent,
    StateEventCollection: StateEventCollection,
    Transition: Transition,
    TransitionExpression: TransitionExpression
});

}).call( this );
