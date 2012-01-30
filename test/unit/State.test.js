1&&
( function ( $, assert, undefined ) {

module( "State" );

test( "superstate()", function () {
	var x = new TestObject;
	strictEqual( x.state('Finished.Terminated.ReallyDead').superstate('Finished'), x.state('Finished') );
	strictEqual( x.state('Finished.Terminated.ReallyDead').superstate(''), x.state().root() );
	strictEqual( x.state('Finished.Terminated.ReallyDead').superstate(), x.state('Finished.Terminated') );
	strictEqual( x.state().root().superstate(), undefined );
});

test( "match()", function () {
	var x = new TestObject;
	assert.ok( x.state().match( 'Finished.*', x.state('Finished.CleaningUp') ) );
	assert.ok( x.state().match( 'Finished.*', x.state('Finished.Terminated') ) );
	assert.ok( !x.state().match( 'Finished.*', x.state('Waiting') ) );
	assert.ok( !x.state().match( 'Finished.*', x.state('Finished') ) );
	assert.ok( x.state('Finished').match( '.Terminated', x.state('Finished.Terminated') ) );
	assert.ok( x.state('Finished').match( '.*', x.state('Finished.CleaningUp') ) );
	assert.ok( x.state('Finished').match( '.*', x.state('Finished.Terminated') ) );
	assert.ok( x.state().match( '*', x.state('Finished') ) );
	assert.ok( !x.state().match( '*', x.state('Finished.Terminated') ) );
	assert.ok( x.state().match( '**', x.state('Finished.Terminated') ) );
	assert.ok( x.state('Finished').match( '.*', x.state('Finished.Terminated') ) );
	assert.ok( x.state('Finished').match( '.**', x.state('Finished.Terminated') ) );
	
	assert.equal( x.state().match( 'Finished' ), x.state('Finished') );
	assert.equal( x.state().match( '*' ).length, 3 );
	assert.equal( x.state().match( '**' ).length, 8 );
	assert.equal( x.state('Finished').match( '.Terminated' ), x.state('Finished.Terminated') );
	assert.equal( x.state('Finished').match( '.*' ).length, 2 );
	strictEqual( x.state().match( '*', x.state('Finished') ), true );
	strictEqual( x.state().match( '*', x.state('Finished.CleaningUp') ), false );
	strictEqual( x.state().match( '**', x.state('Finished.CleaningUp') ), true );
	strictEqual( x.state().match( 'Finished.*', x.state('Finished.CleaningUp') ), true );
	strictEqual( x.state().match( 'Finished.*', x.state('Finished.Terminated') ), true );
});

test( "isIn()", function () {
	var x = new TestObject;
	assert.ok( x.state('Waiting').isIn( x.state().root() ) );
	assert.ok( x.state('Finished.CleaningUp').isIn( x.state().root() ) );
	assert.ok( x.state('Finished.CleaningUp').isIn( x.state('Finished') ) );
	assert.ok( !x.state('Finished.CleaningUp').isIn( x.state('Waiting') ) );
	assert.ok( x.state('Finished').isIn( x.state('Finished') ) );
	assert.ok( !x.state('Finished').isIn( x.state('Finished.CleaningUp') ) );
	assert.ok( !x.state('Finished').isIn( 'Finished.CleaningUp' ) );
	assert.ok( x.state('Finished.CleaningUp').isIn( '.' ) );
});

test( "isSuperstateOf()", function () {
	var x = new TestObject;
	assert.ok( x.state().root().isSuperstateOf( x.state('Waiting') ) );
	assert.ok( x.state().root().isSuperstateOf( x.state('Finished.CleaningUp') ) );
	assert.ok( x.state('Finished').isSuperstateOf( x.state('Finished.CleaningUp') ) );
	assert.ok( !x.state('Finished').isSuperstateOf( x.state('Active') ) );
});

test( "substates()", function () {
	var	x = new TestObject,
		states = x.state().root().substates( true );
	assert.ok( ( states.length == 8 ) );
});

test( "initialSubstate()", function () {
	function Foo () {}
	state( Foo.prototype, {
		Fizzy: state('initial'),
		Buzzy: {}
	});

	Z.inherit( Bar, Foo );
	function Bar () {}
	state( Bar.prototype, {
		Fizzy: {
			Fuzzy: state('initial')
		}
	});

	Z.inherit( Baz, Bar );
	function Baz () {}
	state( Baz.prototype, {
		Buzzy: {
			Bizzy: state('initial')
		}
	});

	Z.inherit( Qux, Baz );
	function Qux () {}
	state( Qux.prototype, {
		Wizzy: {
			Wuzzy: {}
		}
	});

	var	foo = new Foo,
		bar = new Bar,
		baz = new Baz,
		qux = new Qux;
	
	assert.strictEqual( foo.state().name(), 'Fizzy' );
	assert.strictEqual( bar.state().name(), 'Fuzzy' );
	assert.strictEqual( baz.state().name(), 'Bizzy' );
	assert.strictEqual( qux.state().name(), 'Bizzy' );
	assert.ok( foo.state().change('Buzzy') );
	assert.strictEqual( foo.state().name(), 'Buzzy' );
	assert.ok( bar.state().change('Buzzy') );
	assert.strictEqual( bar.state().name(), 'Buzzy' );
	assert.ok( baz.state().change('Fizzy') );
	assert.strictEqual( baz.state().name(), 'Fizzy' );
	assert.ok( qux.state().change('Fizzy') );
	assert.ok( qux.state().isVirtual() );
	assert.strictEqual( qux.state().name(), 'Fizzy' );
});

test( "depth()", function () {
	var x = new TestObject;
	assert.equal( x.state().root().depth(), 0 );
	assert.equal( x.state('Finished.Terminated').depth(), 2 );
});

test( "common()", function () {
	var x = new TestObject;
	assert.equal( x.state('Finished.Terminated').common( x.state('Finished') ), x.state('Finished') );
	assert.equal( x.state('Finished.Terminated').common( x.state('Finished.CleaningUp') ), x.state('Finished') );
	assert.equal( x.state('Finished.Terminated').common( x.state('Active') ), x.state().root() );
	assert.equal( x.state().root().common( x.state().root() ), x.state().root() );
	assert.equal( x.state('Active').common( x.state('Finished.Terminated') ), x.state().root() );
	assert.equal( x.state('Waiting').common( x.state('Waiting') ), x.state('Waiting') );
	assert.equal( x.state('Finished').common( x.state('Finished.CleaningUp') ), x.state('Finished') );
});

test( "removeState()", function () {
	// test simple removal
	// test removal of 'Finished' with substates
	// test removal of 'Finished' while inside a substate
	// test forced bubbling with removal of 'Finished' while inside 'Terminated'
});

})( jQuery, QUnit || require('assert') );
