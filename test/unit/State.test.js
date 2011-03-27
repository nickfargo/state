( function ( $, undefined ) {

module( "State" );


test( "match()", function() {
	var x = new TestObject();
	ok( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ) );
	ok( x.state.match( 'Finished.*', x.state.Finished.Terminated ) );
	ok( !x.state.match( 'Finished.*', x.state.Preparing ) );
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
	equal( x.state.match( '**' ).length, 5 );
	equal( x.state.Finished.match( '.Terminated' ), x.state.Finished.Terminated );
	equal( x.state.Finished.match( '.*' ).length, 2 );
	strictEqual( x.state.match( '*', x.state.Finished ), true );
	strictEqual( x.state.match( '*', x.state.Finished.CleaningUp ), false );
	strictEqual( x.state.match( '**', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.Terminated ), true );
});

test( "isSuperstateOf()", function() {
	var x = new TestObject();
	ok( x.state.defaultState().isSuperstateOf( x.state.Preparing ) );
	ok( x.state.defaultState().isSuperstateOf( x.state.Finished.CleaningUp ) );
	ok( x.state.Finished.isSuperstateOf( x.state.Finished.CleaningUp ) );
	ok( !x.state.Finished.isSuperstateOf( x.state.Ready ) );
});

test( "substates()", function() {
	var	x = new TestObject(),
		states = x.state.defaultState().substates( true );
	ok( ( console.log( states ), states.length == 5 ) );
});

test( "depth()", function() {
	var x = new TestObject();
	equal( x.state.defaultState().depth(), 0 );
	equal( x.state.Finished.Terminated.depth(), 2 );
});

test( "common()", function () {
	var x = new TestObject();
	equal( x.state.Finished.Terminated.common( x.state.Finished ), x.state.Finished );
	equal( x.state.Finished.Terminated.common( x.state.Finished.CleaningUp ), x.state.Finished );
	equal( x.state.Finished.Terminated.common( x.state.Ready ), x.state.defaultState() );
	equal( x.state.defaultState().common( x.state.defaultState() ), x.state.defaultState() );
	equal( x.state.Ready.common( x.state.Finished.Terminated ), x.state.defaultState() );
	equal( x.state.Preparing.common( x.state.Preparing ), x.state.Preparing );
	equal( x.state.Finished.common( x.state.Finished.CleaningUp ), x.state.Finished );
});

test( "removeState()", function () {
	// test simple removal
	// test removal of 'Finished' with substates
	// test removal of 'Finished' while inside a substate
	// test forced bubbling with removal of 'Finished' while inside 'Terminated'
});

})( jQuery );
