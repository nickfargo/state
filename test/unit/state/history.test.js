module( "state/history" );

test( "", function () {
    var o = {};
    state( o, 'history', {
        data: { a:1, b:[0,1], c:{ d:1, e:[2,3] } },
        Foo: {},
        Bar: {}
    });

    strictEqual( o.state('Foo').historian(), o.state('') );
    strictEqual( o.state('Bar').historian(), o.state('') );

    o.state('-> Foo');
    o.state().data( { a:2, b:[0,2], c:{ e:[2,4] } } );

    o.state('-> Bar');
    o.state().data( { a:1, b:[1,2], c:{ d:1, e:[2,4] } } );

    // deepEqual( o.state().history(), { a:1, b:[1,2], c:{ d:1, e:[2,4] } } );
});
