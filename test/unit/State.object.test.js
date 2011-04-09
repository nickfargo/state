( function ( $, undefined ) {

module( "State.object" );

test( "Object creation", function () {
	var x = new TestObject(),
		arr;
	ok( x.state instanceof State.Controller, "StateController created" );
	
	ok( x.state.Preparing instanceof State, "State 'Preparing' created" );
	ok( x.state.Preparing.method( 'methodOne', false, false ), "Method 'methodOne' in state 'Preparing' created" );
	ok( x.state.is('Preparing'), "In state 'Preparing'" );
	equal( x.methodOne(), 'Preparing.methodOne', "methodOne() on TestObject returns proper method for state 'Preparing'" );
	
	ok( x.state.Ready instanceof State );
	ok( !x.state.Ready.method( 'methodOne', false, false ) );
	ok( x.state.Ready.method( 'methodTwo', false, false ) );
	arr = x.state.Ready.getEventListeners('arrive');
	equal( arr.length, 1, arr.keys() );
	arr = x.state.Ready.getEventListeners('depart');
	equal( arr.length(), 2, arr.keys() );
});

test( "Null state change", function () {
	var x = new TestObject();
	ok( x.state.change( x.state.current() ).state.is('Preparing'), "StateController.change() to current state" );
	ok( x.state.current() === x.state.current().select(), "State.select() on current state" );
});

test( "Simple state change", function () {
	var x = new TestObject();
	ok( x.state.change('Ready'), "Change to state 'Ready'" );
	ok( x.state.change('Finished'), "Change to state 'Finished'" );
	ok( x.state.change(), "Change to default state" );
});

test( "State changes from parent state into child state", function () {
	var x = new TestObject(''), result;
	ok( x.state.is(''), "Initialized to default state" );
	ok( result = x.state.change('Finished'), "Changed to state 'Finished' " + result.toString() );
	ok( x.state.change('.CleaningUp'), "Changed to child state 'CleaningUp' using relative selector syntax" );
});

test( "State changes from one child state sibling to another", function () {
	var x = new TestObject('Finished');
	ok( x.state.is('Finished'), "Initialized to state 'Finished'" );
	ok( x.state.change('Finished').state.change('.CleaningUp'), "Null state change chained to change to child state" );
	ok( x.state.change('..Terminated'), "Change to sibling state using relative selector syntax" );
});

test( "Method resolutions", function () {
	var x = new TestObject('');
	equal( x.methodOne(), 'methodOne' );
	equal( x.methodTwo(), 'methodTwo' );
	ok( x.state.change('Preparing'), "State 'Preparing'" );
	equal( x.methodOne(), 'Preparing.methodOne' );
	equal( x.methodTwo(), 'methodTwo' );
	ok( x.state.change('Ready'), "State 'Ready'" );
	equal( x.methodOne(), 'methodOne' );
	equal( x.methodTwo(), 'Ready.methodTwo' );
	ok( x.state.change('Finished'), "State 'Finished'" );
	equal( x.methodOne(), 'Finished.methodOne' );
	equal( x.methodTwo(), 'methodTwo' );
	equal( x.methodThree(1,2), 'Finished.methodThree uno=1 dos=2' );
	ok( x.state.change('.CleaningUp').state.is('Finished.CleaningUp'), "State 'Finished.CleaningUp'" );
	equal( x.methodOne(), 'Finished.methodOne' );
	equal( x.methodTwo(), 'Finished.CleaningUp.methodTwo' );
	ok( x.state.change('..Terminated').state.is('Finished.Terminated'), "State 'Finished.Terminated'" );
	equal( x.methodOne(), 'Finished.methodOne' );
	equal( x.methodTwo(), 'Finished.Terminated.methodTwo' );
	equal( x.methodThree(1,2), 'Finished.Terminated.methodThree : Finished.methodThree uno=1 dos=2' );
});

test( "Rules", function () {
	var x = new TestObject('Finished');
	ok( !x.state.change('Preparing') );
	ok( !x.state.change('Ready') );
	ok( x.state.change('.Terminated') );
	ok( !x.state.change('') );
});

})( jQuery );
