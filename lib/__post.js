// Make the set of defined classes available as members of the exported module.
Z.assign( state, {
	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	Transition: Transition,
	TransitionDefinition: TransitionDefinition
});

}).call( this );
