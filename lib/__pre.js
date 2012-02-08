( function ( undefined ) {

var	global = this,
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z,

	// ### State attributes
	STATE_ATTRIBUTES = {
		NORMAL      : 0x0,

		// A **virtual state** is a lightweight inheritor of a **protostate** located higher in the
		// owner object's prototype chain.
		VIRTUAL     : 0x1,

		// Marking a state `initial` specifies which state a newly instantiated `StateController`
		// should assume.
		INITIAL     : 0x2,

		// Once a state marked `final` is entered, no further outbound transitions are allowed.
		FINAL       : 0x4,

		// An **abstract state** cannot be assumed directly. A transition target that points to a
		// state marked `abstract` is interpreted in terms of one (or more) of its substates.
		ABSTRACT    : 0x8,

		// Marking a state `default` designates it as the actual target for any transition that
		// targets its abstract superstate.
		DEFAULT     : 0x10,

		// A state marked `sealed` cannot have substates.
		SEALED      : 0x20,

		// In a state marked `regioned`, any substates are considered **concurrent orthogonal
		// regions**. Upon entering a regioned state, the controller creates a new set of
		// subcontrollers, one for each region, which will exist as long as the regioned state
		// remains active. Method calls are forwarded to at most one of the regions, while event
		// emissions are propagated to all of the regions. *(Not presently implemented.)*
		REGIONED    : 0x40
	},

	// 
	STATE_DEFINITION_CATEGORIES =
		'data methods events guards states transitions',
	
	STATE_EVENT_TYPES =
		'construct depart exit enter arrive destroy mutate',
	
	GUARD_ACTIONS =
		'admit release',
	
	TRANSITION_PROPERTIES =
		'origin source target action',
	
	TRANSITION_DEFINITION_CATEGORIES =
		'methods events',
	
	TRANSITION_EVENT_TYPES =
		'construct destroy enter exit start end abort';

// ## state()
// 
// The module is exported as a function that can be used either to return a `StateDefinition`, or
// to apply a new state implementation to an arbitrary owner.
// 
// ##### StateDefinition state( [String modifiers,] Object definition )
// 
// If supplied with only one object-typed argument, a `StateDefinition` based on the contents of
// `definition` is returned. *See [`StateDefinition`](#state-definition)*
// 
// ##### State state( [String modifiers,] Object owner, [String name,] Object definition [, Object|String options] )
// 
// With two object-typed arguments, the second of the two similarly specifies a `StateDefinition`,
// while the first object specifies an `owner` object to which a new state implementation created
// from that definition will be applied. The function returns the owner's initial `State`.

function state ( attributes, owner, name, definition, options ) {
	typeof attributes === 'string' || ( options = definition, definition = name, name = owner,
		owner = attributes, attributes = null );
	if ( name === undefined && definition === undefined && options === undefined ) {
		return new StateDefinition( attributes, definition = owner )
	}

	typeof name === 'string' || ( options = definition, definition = name, name = null );
	return ( new StateController( owner, name || 'state',
		new StateDefinition( attributes, definition ), options ) ).current();
}

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

Z.assign( state, {
	VERSION: '0.0.3',

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});
