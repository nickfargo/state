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
    var o = {};
    state( o, {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    function probe ( s ) {
        ok( s.has('a')        === true  );
        ok( s.has('a.b')      === true  );
        ok( s.has('a.b.c')    === true  );
        ok( s.has('a.b.c.d')  === false );
    }

    probe( o.state('A') );
    probe( o.state('AA') );

    o = Object.create( o );
    state( o, null );

    o.state('-> A');
    probe( o.state() );

    o.state('-> AA');
    probe( o.state() );
});

test( "get", function () {
    var o = {};
    state( o, {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    function probe ( s ) {
        var a = s.get('a');
        ok( O.isPlainObject( a ) && O.keys( a ).length === 1 && 'b' in a );

        var b = s.get('a.b');
        ok( O.isPlainObject( b ) && O.keys( b ).length === 1 && 'c' in b );

        var c = s.get('a.b.c');
        ok( O.isNumber( c ) && c === 3 );

        var d = s.get('a.b.c.d');
        ok( d === undefined );
    }

    probe( o.state('A') );
    probe( o.state('AA') );

    var p = o;
    o = Object.create( p );
    state( o, null );

    o.state('-> A');
    probe( o.state() );

    o.state('-> AA');
    probe( o.state() );
});

test( "let", function () {
    var o = {};
    state( o, {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('A').let( 'a.b.c', 4 ) === undefined,
        "States are not mutable, `let` should fail"
    );

    o = {};
    state( o, 'mutable', {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('A').let( 'a.b.c', 4 ) === 4,
        "With mutable states, `let` succeeds and returns the written value"
    );
    ok( o.state('AA').get('a.b.c') === 4 );
    
    ok( o.state('AA').let( 'a.b', 2 ) === 2 );
    ok( o.state('A').get('a.b.c') === 4,
        "`let`ting on a substate does not affect data of a superstate."
    );
});

test( "set", function () {
    var o = {};
    state( o, {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('A').set( 'a.b.c', 4 ) === undefined,
        "States are not mutable, `set` should fail"
    );

    o = {};
    state( o, 'mutable', {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('AA').set( 'a.b.c', 4 ) === 4 );
    ok( o.state('A').get('a.b.c') === 4,
        "`set`ting on a substate that inherits a property from a superstate " +
        "should change the superstate’s property."
    );
    ok( o.state('AA').set( 'a.b.d', 5 ) === 5,
        "`set` on a property that is not 'own' or inherited results in a `let`."
    );


    var p = o;
    o = Object.create( p );
    o.state('-> A');
    ok( o.state().set( 'a.b.c', 5 ) === 5 );
    ok( p.state('A').get('a.b.c') === 4,
        "`set`ting on an epistate that inherits a property from a protostate " +
        "should not affect the protostate’s property."
    );
});

test( "delete", function () {
    var o = {};
    state( o, {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('A').delete( 'a.b.c' ) === false,
        "States are not mutable, `delete` should fail, returning `false`."
    );
    ok( o.state('A').get('a.b.c') === 3 );

    o = {};
    state( o, 'mutable', {
        A: {
            data: { a: { b: { c: 3 } } },
            AA: state
        }
    });

    ok( o.state('A').delete('a.b.c') === true,
        "With mutable states, `delete` succeeds and returns `true`."
    );
    ok( o.state('A').get('a.b.c') === undefined );
})

