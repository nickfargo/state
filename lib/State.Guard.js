/**
 * (Presently only a candidate for inclusion.)
 */
function StateGuard ( map ) {
	extend( true, this, map );
}

State.Guard = extend( true, StateGuard, {
	types: [ 'admit', 'release' ],
	prototype: {
		evaluate: function () {}
	}
});