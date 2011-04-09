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
			failure: function () { callback = false; }
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
	x.state.Preparing.addEventListener( 'exit', function () { out += "fee"; console.log( "Preparing.exit" ); } );
	x.state.Finished.addEventListener( 'enter', function () { out += "fi"; console.log( "Finished.enter" ); } );
	x.state.Finished.CleaningUp.addEventListener( 'enter', function () { out += "fo"; console.log( "Finished.CleaningUp.enter" ); } );
	equal( ( x.state.change( 'Finished.CleaningUp' ), out ), "feefifo" );
});

})( jQuery );