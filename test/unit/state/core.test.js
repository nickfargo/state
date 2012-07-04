module( "state/core" );

var State           = state.State;
var StateController = state.StateController;

test( "State creation", function () {
    var x = new TestObject;

    ok( x.state().controller() instanceof StateController,
        "StateController created"
    );

    ok( x.state('Waiting') instanceof State,
        "State 'Waiting' created"
    );

    ok( x.state('Waiting').method( 'methodOne', false, false ),
        "Method 'methodOne' in state 'Waiting' created"
    );

    ok( x.state().is('Waiting'),
        "In state 'Waiting'"
    );

    ok( x.methodOne() === 'Waiting.methodOne',
        "Calling delegator `methodOne` returns proper method for state `Waiting`"
    );

    ok( x.state('Active'),
        "State `Active` exists"
    );

    ok( x.state('Hyperactive'),
        "State `Hyperactive` exists"
    );

    ok( !x.state('Active').method( 'methodOne', false, false ),
        "State `Active` does not contain method `methodOne`"
    );

    ok( x.state('Active').method( 'methodTwo', false, false ),
        "State `Active` does contain method `methodTwo`"
    );
});

test( "State destruction", function () {
    var x = new TestObject;

    ok( x.methodOne.isDelegator,
        "First establish that `methodOne` is a delegator method"
    );

    ok( x.state().controller().destroy(),
        "Successfully destroyed the state implementation from its root"
    );

    ok( typeof x.methodOne === 'function' && !x.methodOne.isDelegator,
        "Delegator is destroyed, original method returned to owner"
    );
});
