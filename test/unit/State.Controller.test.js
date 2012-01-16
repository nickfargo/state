1&&
( function ( $, assert, undefined ) {

module( "StateController" );

test( "isInState()", function () {
	var x = new TestObject('Waiting');
	assert.ok( x.state().isIn('Waiting') );
	assert.ok( x.state().change('Active').isIn('Active') );
	assert.ok( x.state().change('Finished'), !x.state().isIn('Finished') ); // false because change('Finished') is delayed
	assert.ok( x.state().change('Finished.CleaningUp').isIn('Finished') );
	assert.ok( x.state().isIn('Finished.CleaningUp') );
});

test( "change()", function () {
	var x = new TestObject('');
	var callback;
	
	// This state change attempt should succeed, so the `success` callback in `change()` should be called
	assert.strictEqual( ( x.state().change(
		'Waiting', {
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function" );
	callback = undefined;
	
	// This state change attempt should fail since Terminated disallows further state changes,
	// so the `fail` callback in `change()` should be called
	x.state().change( 'Finished.Terminated' );
	assert.strictEqual( ( x.state().change(
		'Waiting', {
			failure: function () { callback = false; }
		}), callback ), false, "Callback to fail function" );
	callback = undefined;
	
	// This state change attempt should succeed; it is the same as above except `forced`
	assert.strictEqual( ( x.state().change(
		'Waiting', {
			forced: true,
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function");
	callback = undefined;
});

test( "change() bubble/capture", function () {
	var out = '', x = new TestObject('Waiting');
	x.state('Waiting').addEvent( 'exit', function () { out += "fee"; } );
	x.state('Finished').addEvent( 'enter', function () { out += "fi"; } );
	x.state('Finished.CleaningUp').addEvent( 'enter', function () { out += "fo"; } );
	assert.equal( ( x.state().change( 'Finished.CleaningUp' ), out ), "feefifo" );
});

})( jQuery, QUnit || require('assert') );