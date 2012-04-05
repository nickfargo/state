1&&
( function ( $, assert, undefined ) {

module( "StateEvent" );

test( "String as transition target", function () {
    var o = {};
    state( o, {
        A: { events: { foo: 'B' } },
        B: { events: { bar: 'A' } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

test( "String as transition target as last element in Array", function () {
    var o = {};
    state( o, {
        A: { events: { foo: [ function ( event ) { return 'aString'; }, 'B' ] } },
        B: { events: { bar: [ function ( event ) { return 'aString'; }, 'A' ] } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

test( "Transition executed after callbacks", 4, function () {
    function fn ( event ) { assert.ok( o.state() === this ); }
    var o = {};
    state( o, {
        A: { events: { foo: [ 'B', fn ] } },
        B: { events: { bar: [ 'A', fn ] } }
    });
    o.state().change('A');

    o.state().emit('foo');
    assert.ok( o.state().name() === "B" );
    o.state().emit('bar');
    assert.ok( o.state().name() === "A" );
});

})( jQuery, QUnit || require('assert') );