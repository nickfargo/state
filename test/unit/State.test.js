( function ( $, undefined ) {

module( "State" );

test( "superstate()", function () {
	var x = new TestObject();
	strictEqual( x.state.Finished.Terminated.ReallyDead.superstate('Finished'), x.state.Finished );
	strictEqual( x.state.Finished.Terminated.ReallyDead.superstate(''), x.state.defaultState() );
	strictEqual( x.state.Finished.Terminated.ReallyDead.superstate(), x.state.Finished.Terminated );
	strictEqual( x.state.defaultState().superstate(), undefined );
});

test( "match()", function () {
	var x = new TestObject();
	ok( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ) );
	ok( x.state.match( 'Finished.*', x.state.Finished.Terminated ) );
	ok( !x.state.match( 'Finished.*', x.state.Waiting ) );
	ok( !x.state.match( 'Finished.*', x.state.Finished ) );
	ok( x.state.Finished.match( '.Terminated', x.state.Finished.Terminated ) );
	ok( x.state.Finished.match( '.*', x.state.Finished.CleaningUp ) );
	ok( x.state.Finished.match( '.*', x.state.Finished.Terminated ) );
	ok( x.state.match( '*', x.state.Finished ) );
	ok( !x.state.match( '*', x.state.Finished.Terminated ) );
	ok( x.state.match( '**', x.state.Finished.Terminated ) );
	ok( x.state.Finished.match( '.*', x.state.Finished.Terminated ) );
	ok( x.state.Finished.match( '.**', x.state.Finished.Terminated ) );
	
	equal( x.state.match( 'Finished' ), x.state.Finished );
	equal( x.state.match( '*' ).length, 3 );
	equal( x.state.match( '**' ).length, 8 );
	equal( x.state.Finished.match( '.Terminated' ), x.state.Finished.Terminated );
	equal( x.state.Finished.match( '.*' ).length, 2 );
	strictEqual( x.state.match( '*', x.state.Finished ), true );
	strictEqual( x.state.match( '*', x.state.Finished.CleaningUp ), false );
	strictEqual( x.state.match( '**', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.Terminated ), true );
});

test( "isIn()", function () {
	var x = new TestObject();
	ok( x.state.Waiting.isIn( x.state.defaultState() ) );
	ok( x.state.Finished.CleaningUp.isIn( x.state.defaultState() ) );
	ok( x.state.Finished.CleaningUp.isIn( x.state.Finished ) );
	ok( !x.state.Finished.CleaningUp.isIn( x.state.Waiting ) );
	ok( x.state.Finished.isIn( x.state.Finished ) );
	ok( !x.state.Finished.isIn( x.state.Finished.CleaningUp ) );
	ok( !x.state.Finished.isIn( 'Finished.CleaningUp' ) );
	ok( x.state.Finished.CleaningUp.isIn( '.' ) );
});

test( "isSuperstateOf()", function () {
	var x = new TestObject();
	ok( x.state.defaultState().isSuperstateOf( x.state.Waiting ) );
	ok( x.state.defaultState().isSuperstateOf( x.state.Finished.CleaningUp ) );
	ok( x.state.Finished.isSuperstateOf( x.state.Finished.CleaningUp ) );
	ok( !x.state.Finished.isSuperstateOf( x.state.Active ) );
});

test( "substates()", function () {
	var	x = new TestObject(),
		states = x.state.defaultState().substates( true );
	ok( ( states.length == 8 ) );
});

test( "depth()", function () {
	var x = new TestObject();
	equal( x.state.defaultState().depth(), 0 );
	equal( x.state.Finished.Terminated.depth(), 2 );
});

test( "common()", function () {
	var x = new TestObject();
	equal( x.state.Finished.Terminated.common( x.state.Finished ), x.state.Finished );
	equal( x.state.Finished.Terminated.common( x.state.Finished.CleaningUp ), x.state.Finished );
	equal( x.state.Finished.Terminated.common( x.state.Active ), x.state.defaultState() );
	equal( x.state.defaultState().common( x.state.defaultState() ), x.state.defaultState() );
	equal( x.state.Active.common( x.state.Finished.Terminated ), x.state.defaultState() );
	equal( x.state.Waiting.common( x.state.Waiting ), x.state.Waiting );
	equal( x.state.Finished.common( x.state.Finished.CleaningUp ), x.state.Finished );
});

test( "removeState()", function () {
	// test simple removal
	// test removal of 'Finished' with substates
	// test removal of 'Finished' while inside a substate
	// test forced bubbling with removal of 'Finished' while inside 'Terminated'
});

})( jQuery );
