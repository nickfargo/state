module( "state/mutation" );

var o = {};
state( o, 'mutable', {
    data: { a:1, b:'two' },
    mutate: function ( mutation, delta, before, after ) {
        ok( true, "mutate event at root state" );
    },
    S1: {
        data: { a:3, b:'four' },
        run: function () { return 'foo'; },
        tap: 'S2',
        mutate: function ( mutation, delta, before, after ) {
            ok( true, "mutate event at substate" );
        }
    },
    S2: {
        data: { a:5, b:'six' },
        run: function () { return 'bar'; },
        tap: 'S1'
    }
});

test( "Complimentarity of `express()` / `mutate()`", function () {
    var keys, id, list;

    function f ( n ) {
        return f[n] = function () {};
    }

    id = o.state('S1').on( 'mutate', function ( mutation, delta ) {
        var index = O.keys( delta.events.tap )[0],
            compare = { events: { tap: {} } };

        compare.events.tap[ index ] = O.NIL;

        deepEqual( delta, compare,
            "delta.events.tap[" + index + "]:NIL"
        );
    });
    o.state().mutate({ S1:{ events:{ tap:'S3' } } });
    ok(
        o.state('S1').event('tap') === 2,
        "ok"
    );
    o.state('S1').off( 'mutate', id );

    keys = O.keys( o.state('S1').express().events.tap );
    ok(
        o.state('S1').express().events.tap[ keys[0] ] === 'S2',
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[1] ] === 'S3',
        "ok"
    );

    list = {};
    list[ keys[0] ] = list[ keys[1] ] = O.NIL;
    o.state('S1').mutate({
        events: {
            tap: [ f(0), f(1), f(2), list ]
        }
    });
    ok(
        o.state('S1').event('tap') === 3,
        "ok"
    );

    keys = O.keys( o.state('S1').express().events.tap );
    ok(
        o.state('S1').express().events.tap[ keys[0] ] === f[0],
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[1] ] === f[1],
        "ok"
    );
    ok(
        o.state('S1').express().events.tap[ keys[2] ] === f[2],
        "ok"
    );
});
