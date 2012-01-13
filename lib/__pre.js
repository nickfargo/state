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
	Z = typeof require !== 'undefined' ? require('zcore') : global.Z;

function state () {
	return ( arguments.length < 2 ? StateDefinition : StateController )
		.apply( this, arguments );
}

Z.extend( state, {
	VERSION: '0.0.1',

	State: State,
	StateDefinition: StateDefinition,
	StateController: StateController,
	StateEvent: StateEvent,
	StateEventCollection: StateEventCollection,
	StateProxy: StateProxy,
	StateTransition: StateTransition,
	StateTransitionDefinition: StateTransitionDefinition,

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
