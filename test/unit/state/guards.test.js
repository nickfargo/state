module( "state/guards" );

test( "Guards", function () {
    var x = new TestObject('Finished');
    
    x.state('-> Waiting');
    ok( !x.state().is('Waiting'),
        "'Finished' to 'Waiting' disallowed"
    );

    x.state('-> Active');
    ok( !x.state().is('Active'),
        "'Finished' to 'Active' disallowed"
    );

    x.state('-> .Terminated');
    ok( x.state().is('Terminated'),
        "'Finished' to 'Finished.Terminated' allowed"
    );

    x.state('->');
    ok( !x.state().is(''),
        "'Finished.Terminated' to root state disallowed"
    );
});
