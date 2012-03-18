( function ( assert, undefined ) {

module( "State history" );

test( "", function () {
    var o = {};
    state( o, 'history', {
        data: { a:1, b:[0,1], c:{ d:1, e:[2,3] } },
        Foo: {},
        Bar: {}
    });

    assert.strictEqual( o.state('Foo').historian(), o.state('') );
    assert.strictEqual( o.state('Bar').historian(), o.state('') );
    
    o.state().go('Foo');
    o.state().data( { a:2, b:[0,2], c:{ e:[2,4] } } );

    o.state().go('Bar');
    o.state().data( { a:1, b:[1,2], c:{ d:1, e:[2,4] } } );

    // assert.deepEqual( o.state().history(), { a:1, b:[1,2], c:{ d:1, e:[2,4] } } );
});

})( QUnit );