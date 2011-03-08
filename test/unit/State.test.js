( function( $, undefined ) {

module( "State" );


test( "match()", function() {
	var x = new TestObject[0]();
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

test( "isAncestorOf()", function() {
	var x = new TestObject[0]();
	ok( x.state.defaultState().isAncestorOf( x.state.Preparing ) );
	ok( x.state.defaultState().isAncestorOf( x.state.Finished.CleaningUp ) );
	ok( x.state.Finished.isAncestorOf( x.state.Finished.CleaningUp ) );
	ok( !x.state.Finished.isAncestorOf( x.state.Ready ) );
});

test( "substates()", function() {
	var	x = new TestObject[0](),
		states = x.state.defaultState().substates( true );
	ok( ( console.log( states ), states.length == 5 ) );
});

})(jQuery);
