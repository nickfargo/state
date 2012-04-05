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

test( "Deterministic FSM", function () {
    function IsDivisibleByThreeComputer () {
        state( this, 'abstract', {
            s0: state( 'initial default',
                { events: { '0':'s0', '1':'s1' } } ),
            s1: { events: { '0':'s2', '1':'s0' } },
            s2: { events: { '0':'s1', '1':'s2' } }
        });
    }
    IsDivisibleByThreeComputer.prototype.compute = function ( number ) {
        var i, l, binary = number.toString(2);
        this.state().go('s0');
        for ( i = 0, l = binary.length; i < l; i++ ) {
            this.state().emit( binary[i] );
        }
        return this.state().is('s0');
    }

    var three = new IsDivisibleByThreeComputer;
    assert.equal( three.compute(8), false );
    assert.equal( three.compute(78), true );
    assert.equal( three.compute(1000), false );
    assert.equal( three.compute(504030201), true );
});

})( jQuery, QUnit || require('assert') );