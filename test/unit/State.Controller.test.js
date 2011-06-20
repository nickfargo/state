( function ( $, undefined ) {

module( "State.Controller" );

test( "isInState()", function () {
	var x = new TestObject('Waiting');
	ok( x.state.isIn('Waiting') );
	ok( x.state.change('Active').isIn('Active') );
	ok( x.state.change('Finished').isIn('Finished') );
	ok( x.state.change('.CleaningUp').isIn('Finished') );
	ok( x.state.isIn('Finished.CleaningUp') );
});

test( "change()", function () {
	var x = new TestObject('');
	var callback;
	
	// This state change attempt should succeed, so the `success` callback in `change()` should be called
	strictEqual( ( x.state.change(
		'Waiting', {
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function" );
	callback = undefined;
	
	// This state change attempt should fail since Terminated disallows further state changes,
	// so the `fail` callback in `change()` should be called
	x.state.change( 'Finished.Terminated' );
	strictEqual( ( x.state.change(
		'Waiting', {
			failure: function () { callback = false; }
		}), callback ), false, "Callback to fail function" );
	callback = undefined;
	
	// This state change attempt should succeed; it is the same as above except `forced`
	strictEqual( ( x.state.change(
		'Waiting', {
			forced: true,
			success: function () { callback = true; }
		}), callback ), true, "Callback to success function");
	callback = undefined;
});

test( "change() bubble/capture", function () {
	var out = '', x = new TestObject('Waiting');
	x.state.Waiting.addEvent( 'exit', function () { out += "fee"; } );
	x.state.Finished.addEvent( 'enter', function () { out += "fi"; } );
	x.state.Finished.CleaningUp.addEvent( 'enter', function () { out += "fo"; } );
	equal( ( x.state.change( 'Finished.CleaningUp' ), out ), "feefifo" );
});

})( jQuery );