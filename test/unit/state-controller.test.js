1&&
( function ( $, assert, undefined ) {

module( "StateController" );

test( "change()", function () {
	var x = new TestObject('');
	var result;
	
	// This state change attempt should succeed, so the `success` callback in `change()` should be
	// called.
	x.state().change( 'Waiting', {
		success: function () { result = true; }
	});
	assert.strictEqual( result, true, "Callback to success function" );
	result = undefined;
	
	// A state change from `Terminated` to the root state should fail by order of the `release`
	// guard of `Terminated`, so the `failure` callback provided to `change()` should be called.
	x.state().change( 'Terminated' );
	x.state().change( '', {
		failure: function () { result = false; }
	});
	assert.strictEqual( result, false, "Callback to failure function" );
	result = undefined;
	
	// A `forced` state change attempt should succeed despite being disallowed.
	x.state().change( 'Waiting', {
		forced: true,
		success: function () { result = true; }
	});
	assert.strictEqual( result, true, "Callback to success function" );
	result = undefined;
});

test( "change() bubble/capture", function () {
	var out = '', x = new TestObject('Waiting');
	x.state('Waiting').addEvent( 'exit', function () { out += "fee"; } );
	x.state('Finished').addEvent( 'enter', function () { out += "fi"; } );
	x.state('CleaningUp').addEvent( 'enter', function () { out += "fo"; } );
	assert.equal( ( x.state().change( 'CleaningUp' ), out ), "feefifo" );
});

})( jQuery, QUnit || require('assert') );