module( "StateController" );

test( "change()", function () {
    var x = new TestObject('');
    var result;

    // This state change attempt should succeed, so the `success` callback in
    // `change()` should be called.
    x.state('-> Waiting', {
        success: function () { result = true; }
    });
    ok( result === true,
        "Callback to success function"
    );
    result = undefined;

    // A state change from `Terminated` to the root state should fail by order
    // of the `release` guard of `Terminated`, so the `failure` callback
    // provided to `change()` should be called.
    x.state('-> Terminated');
    x.state('->', {
        failure: function () { result = false; }
    });
    ok( result === false,
        "Callback to failure function"
    );
    result = undefined;

    // A `forced` state change attempt should succeed despite being disallowed.
    x.state('-> Waiting', {
        forced: true,
        success: function () { result = true; }
    });
    ok( result === true,
        "Callback to success function"
    );
    result = undefined;
});

test( "change() bubble/capture", function () {
    var x = new TestObject('Waiting');
    var out = '';

    x.state('Waiting').on( 'exit', function () { out += "fee"; } );
    x.state('Finished').on( 'enter', function () { out += "fi"; } );
    x.state('CleaningUp').on( 'enter', function () { out += "fo"; } );
    
    x.state('-> CleaningUp');
    ok( out === "feefifo",
        "ok"
    );
});

test( "Null state change", function () {
    var x = new TestObject;
    var current = x.state();
    var out = '';

    current.on( 'depart', function () { out += "fee"; } );
    current.on( 'exit'  , function () { out += "fi";  } );
    current.on( 'enter' , function () { out += "fo";  } );
    current.on( 'arrive', function () { out += "fum"; } );

    x.state().change( current );
    ok( x.state().is( current ),
        "current state remains current"
    );
    ok( out === 'feefum',
        "Emits `depart` and `arrive` but not `enter` and not `exit`"
    );
});

test( "Simple state change", function () {
    var x = new TestObject;

    ok( x.state('-> Active'),
        "Change to state 'Active'"
    );
    ok( x.state('-> Finished'),
        "Change to state 'Finished'"
    );
    ok( x.state('->'),
        "Change to root state"
    );
});

test( "State changes from parent state into child state", function () {
    var x = new TestObject('');
    var result;

    ok( x.state().is(''), "Initialized to root state"
    );

    result = x.state('-> Finished');
    ok( result,
        "Changed to state 'Finished' " + result.toString()
    );

    x.state('-> .CleaningUp');
    ok( x.state().is('CleaningUp'),
        "Changed to child state 'CleaningUp' using relative selector syntax"
    );
});

test( "State changes from one child state sibling to another", function () {
    var x = new TestObject('Finished');
    var s;

    ok( x.state().is('Finished'),
        "Initialized to state 'Finished'"
    );

    s = x.state('-> Finished');
    ok( x.state('-> CleaningUp'),
        "Aborted transition redirected to child state"
    );

    ok( x.state('-> ..Terminated'),
        "Change to sibling state using relative selector syntax"
    );
});

test( "Transitional event that causes transition abortion", function () {
    var o = {};
    state( o, {
        A: {
            enter: function () { this.$('-> B'); }
        },
        B: state
    });

    o.state('-> A');
    ok( o.state().is('B'),
        "Transition redirected by a transitional event"
    );
});
