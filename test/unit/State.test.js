( function ( $, assert, undefined ) {

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
	assert.ok( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ) );
	assert.ok( x.state.match( 'Finished.*', x.state.Finished.Terminated ) );
	assert.ok( !x.state.match( 'Finished.*', x.state.Waiting ) );
	assert.ok( !x.state.match( 'Finished.*', x.state.Finished ) );
	assert.ok( x.state.Finished.match( '.Terminated', x.state.Finished.Terminated ) );
	assert.ok( x.state.Finished.match( '.*', x.state.Finished.CleaningUp ) );
	assert.ok( x.state.Finished.match( '.*', x.state.Finished.Terminated ) );
	assert.ok( x.state.match( '*', x.state.Finished ) );
	assert.ok( !x.state.match( '*', x.state.Finished.Terminated ) );
	assert.ok( x.state.match( '**', x.state.Finished.Terminated ) );
	assert.ok( x.state.Finished.match( '.*', x.state.Finished.Terminated ) );
	assert.ok( x.state.Finished.match( '.**', x.state.Finished.Terminated ) );
	
	assert.equal( x.state.match( 'Finished' ), x.state.Finished );
	assert.equal( x.state.match( '*' ).length, 3 );
	assert.equal( x.state.match( '**' ).length, 8 );
	assert.equal( x.state.Finished.match( '.Terminated' ), x.state.Finished.Terminated );
	assert.equal( x.state.Finished.match( '.*' ).length, 2 );
	strictEqual( x.state.match( '*', x.state.Finished ), true );
	strictEqual( x.state.match( '*', x.state.Finished.CleaningUp ), false );
	strictEqual( x.state.match( '**', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.CleaningUp ), true );
	strictEqual( x.state.match( 'Finished.*', x.state.Finished.Terminated ), true );
});

test( "isIn()", function () {
	var x = new TestObject();
	assert.ok( x.state.Waiting.isIn( x.state.defaultState() ) );
	assert.ok( x.state.Finished.CleaningUp.isIn( x.state.defaultState() ) );
	assert.ok( x.state.Finished.CleaningUp.isIn( x.state.Finished ) );
	assert.ok( !x.state.Finished.CleaningUp.isIn( x.state.Waiting ) );
	assert.ok( x.state.Finished.isIn( x.state.Finished ) );
	assert.ok( !x.state.Finished.isIn( x.state.Finished.CleaningUp ) );
	assert.ok( !x.state.Finished.isIn( 'Finished.CleaningUp' ) );
	assert.ok( x.state.Finished.CleaningUp.isIn( '.' ) );
});

test( "isSuperstateOf()", function () {
	var x = new TestObject();
	assert.ok( x.state.defaultState().isSuperstateOf( x.state.Waiting ) );
	assert.ok( x.state.defaultState().isSuperstateOf( x.state.Finished.CleaningUp ) );
	assert.ok( x.state.Finished.isSuperstateOf( x.state.Finished.CleaningUp ) );
	assert.ok( !x.state.Finished.isSuperstateOf( x.state.Active ) );
});

test( "substates()", function () {
	var	x = new TestObject(),
		states = x.state.defaultState().substates( true );
	assert.ok( ( states.length == 8 ) );
});

test( "depth()", function () {
	var x = new TestObject();
	assert.equal( x.state.defaultState().depth(), 0 );
	assert.equal( x.state.Finished.Terminated.depth(), 2 );
});

test( "common()", function () {
	var x = new TestObject();
	assert.equal( x.state.Finished.Terminated.common( x.state.Finished ), x.state.Finished );
	assert.equal( x.state.Finished.Terminated.common( x.state.Finished.CleaningUp ), x.state.Finished );
	assert.equal( x.state.Finished.Terminated.common( x.state.Active ), x.state.defaultState() );
	assert.equal( x.state.defaultState().common( x.state.defaultState() ), x.state.defaultState() );
	assert.equal( x.state.Active.common( x.state.Finished.Terminated ), x.state.defaultState() );
	assert.equal( x.state.Waiting.common( x.state.Waiting ), x.state.Waiting );
	assert.equal( x.state.Finished.common( x.state.Finished.CleaningUp ), x.state.Finished );
});

test( "removeState()", function () {
	// test simple removal
	// test removal of 'Finished' with substates
	// test removal of 'Finished' while inside a substate
	// test forced bubbling with removal of 'Finished' while inside 'Terminated'
});

})( jQuery, QUnit || require('assert') );
