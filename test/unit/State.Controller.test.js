( function ( $, undefined ) {

module( "State.Controller" );

test( "isInState()", function () {
	
});

test( "changeState()", function () {
	var x = new TestObject('');
	var callback;
	
	// This state change attempt should succeed, so the `success` callback in `changeState()` should be called
	strictEqual( ( x.state.change( 'Preparing', function () { callback = true; }, function () { callback = false; } ), callback ), true, "Callback success" );
	callback = undefined;
	
	// This state change attempt should fail since Terminated disallows further state changes,
	// so the `fail` callback in `changeState()` should be called
	x.state.change( 'Finished.Terminated' );
	strictEqual( ( x.state.change( 'Preparing', function () {}, function () { callback = false; } ), callback ), false, "Callback fail" );
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