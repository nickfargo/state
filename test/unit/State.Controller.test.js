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

})( jQuery );