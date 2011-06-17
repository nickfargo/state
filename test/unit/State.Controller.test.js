( function ( $, undefined ) {

module( "State.Controller" );

test( "isInState()", function () {
	var x = new TestObject('Preparing');
	ok( x.state.isIn('Preparing') );
	ok( x.state.change('Ready').isIn('Ready') );
	ok( x.state.change('Finished').isIn('Finished') );
	ok( x.state.change('.CleaningUp').isIn('Finished') );
	ok( x.state.isIn('Finished.CleaningUp') );
});

test( "change()", function () {
	var x = new TestObject('');
	var callback;
	
	// This state change attempt should succeed, so the `success` callback in `change()` should be called
	strictEqual( ( x.state.change(
		'Preparing', {
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function" );
	callback = undefined;
	
	// This state change attempt should fail since Terminated disallows further state changes,
	// so the `fail` callback in `change()` should be called
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

test( "change() bubble/capture", function () {
	var out = '', x = new TestObject('Preparing');
	x.state.Preparing.addEvent( 'exit', function () { out += "fee"; console.log( "Preparing.exit" ); } );
	x.state.Finished.addEvent( 'enter', function () { out += "fi"; console.log( "Finished.enter" ); } );
	x.state.Finished.CleaningUp.addEvent( 'enter', function () { out += "fo"; console.log( "Finished.CleaningUp.enter" ); } );
	equal( ( x.state.change( 'Finished.CleaningUp' ), out ), "feefifo" );
});

})( jQuery );