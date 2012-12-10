module( "state/data" );

test( "Data", function () {
    var NIL = O.NIL;

    function Class () {
        state( this, 'mutable', {
            data: {
                a: 1,
                b: "2",
                c: [ 3, "4", { 5: "foo" } ],
                d: {},
                e: {
                    f: 6,
                    g: "7",
                    h: [ 8, 9 ]
                }
            },
            State1: {
                data: {
                    b: 2,
                    c: [ undefined, undefined, { 5: "bar" } ]
                }
            },
            State2: {
                data: {}
            }
        });
    }
    state( Class.prototype, {
        mutate: function ( mutation, delta, after, before ) {
            ok( true, "mutate event" );
        }
    });

    var o = new Class;

    ok( o.state().data(),
        "Data accessible from `data()`"
    );
    ok( o.state('').data().a === o.state('State1').data().a,
        "Substate data inherits primitive-typed data member from superstate"
    );
    ok( o.state('').data().b !== o.state('State1').data().b,
        "Substate data overrides primitive-typed data member of superstate"
    );
    ok( o.state('State1').data().c[1] === "4",
        "Substate data inherits data member from superstate through own sparse array"
    );

    o.state('').data({
        a: NIL,
        d: { a: 1 },
        e: {
            g: NIL,
            h: [ undefined, "nine" ]
        }
    });
    deepEqual( o.state('').data(),
        {
            b: "2",
            c: [ 3, "4", { 5: "foo" } ],
            d: { a: 1 },
            e: { f: 6, h: [ 8, "nine" ] }
        },
        ""
    );
    deepEqual( o.state('State1').data(),
        {
            b: 2,
            c: [ 3, "4", { 5: "bar" } ],
            d: { a: 1 },
            e: { f: 6, h: [ 8, "nine" ] }
        },
        ""
    );

    expect( 7 );
});

test( "has", function () {

});

test( "get", function () {

});

test( "let", function () {

});

test( "set", function () {

});

