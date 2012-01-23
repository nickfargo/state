// State.js
// 
// Copyright (C) 2011-2012 Nick Fargo, Z Vector Inc.
// 
// License MIT
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

( function ( undefined ) {

var	global = this,
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z,

	STATE_ATTRIBUTES = {
		NORMAL      : 0x0,
		VIRTUAL     : 0x1,
		INITIAL     : 0x2,
		FINAL       : 0x4,
		DEFAULT     : 0x8,
		ABSTRACT    : 0x10,
		SEALED      : 0x20,
		REGIONED    : 0x40
	},

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

/**
 * The exported module is a function, which returns either a `StateDefinition` or
 * a `StateController` bound to an owner object:
 * 
 * StateDefinition state( [String modifiers,] Object definition )
 * StateController state( [String modifiers,] Object owner, [String name,] Object definition [, Object|String options] )
 * 
 * @see StateDefinition
 * @see StateController
 */
function state ( attributes, owner, name, definition, options ) {
	typeof attributes === 'string' || ( options = definition, definition = name, name = owner,
		owner = attributes, attributes = null );
	if ( name === undefined && definition === undefined && options === undefined ) {
		return new StateDefinition( attributes, definition = owner )
	}

	typeof name === 'string' || ( options = definition, definition = name, name = null );
	return new StateController( owner, name || 'state',
		new StateDefinition( attributes, definition ), options );
}

Z.env.server && ( module.exports = exports = state );
Z.env.client && ( global['state'] = state );

Z.assign( state, {
	VERSION: '0.0.1',

	noConflict: ( function () {
		var autochthon = global.state;
		return function () {
			global.state = autochthon;
			return this;
		};
	})()
});
