Z.extend( state, {
	VERSION: '0.0.1',

	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	StateProxy: StateProxy,
	Transition: Transition,
	TransitionDefinition: TransitionDefinition,

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

})();
