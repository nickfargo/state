module( "state/methods" );

test( "Method resolutions", function () {
    var x = new TestObject('');
    var result;


    //
    ok( x.methodOne() === 'methodOne'
    );
    
    ok( x.methodTwo() === 'methodTwo'
    );


    //
    x.state('-> Waiting');
    ok( x.state().is('Waiting'),
        "State 'Waiting'"
    );
    
    ok( x.methodOne() === 'Waiting.methodOne'
    );
    
    ok( x.methodTwo() === 'methodTwo'
    );


    //
    x.state('-> Active');
    ok( x.state().is('Active'),
        "State 'Active'"
    );
    
    ok( x.methodOne() === 'methodOne'
    );

    ok( x.methodTwo() === 'Active.methodTwo'
    );


    //
    result = x.state('-> Finished');
    ok( result,
        "State 'Finished'"
    );

    ok( !x.state().is('Finished'),
        "Transition to `Finished` is asynchronous"
    );
    
    // `!==` because change('Finished') is an async transition
    ok( x.methodOne() !== 'Finished.methodOne'
    );

    // `===` because `methodTwo` isn't overridden by `Finished`
    ok( x.methodTwo() === 'methodTwo'
    );

    // `!==` for the same reason
    ok( x.methodThree(1,2) !== 'Finished.methodThree uno=1 dos=2'
    );


    //
    x.state('-> CleaningUp');
    ok( x.state().is('CleaningUp'),
        "State 'Finished.CleaningUp'"
    );

    ok( x.methodOne() === 'Finished.methodOne'
    );

    ok( x.methodTwo() === 'Finished.CleaningUp.methodTwo'
    );


    //
    x.terminate();
    ok( x.state().is('Terminated'),
        "State 'Finished.Terminated'"
    );

    ok( x.methodOne() === 'Finished.methodOne'
    );

    ok( x.methodTwo() === 'Finished.Terminated.methodTwo'
    );

    ok( x.methodThree(1,2) ===
            'Finished.Terminated.methodThree : Finished.methodThree uno=1 dos=2'
    );
});
