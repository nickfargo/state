( function ( $, undefined ) {

module( "State.Controller" );

test( "isInState()", function () {
	
});

test( "changeState()", function () {
	var x = new TestObject('');
	var callback;
	
	// This state change attempt should succeed, so the `success` callback in `changeState()` should be called
	strictEqual( ( x.state.change(
		'Preparing', {
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function" );
	callback = undefined;
	
	// This state change attempt should fail since Terminated disallows further state changes,
	// so the `fail` callback in `changeState()` should be called
	x.state.change( 'Finished.Terminated' );
	strictEqual( ( x.state.change(
		'Preparing', {
			fail: function () { callback = false; }
		}), callback ), false, "Callback to fail function" );
	callback = undefined;
	
	// This state change attempt should succeed; it is the same as above except `forced`
	strictEqual( ( x.state.change(
		'Preparing', {
			forced: true,
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function");
	callback = undefined;
});

test( "changeState() bubble/capture", function () {
	var out = '', x = new TestObject('Preparing');
	x.state.Preparing.addEventListener( 'bubble', function () { out += "fee"; console.log( "Preparing.bubble" ); } );
	x.state.Finished.addEventListener( 'capture', function () { out += "fi"; console.log( "Finished.capture" ); } );
	x.state.Finished.CleaningUp.addEventListener( 'capture', function () { out += "fo"; console.log( "Finished.CleaningUp.capture" ); } );
	equal( ( x.state.change( 'Finished.CleaningUp' ), out ), "feefifo" );
});

})( jQuery );