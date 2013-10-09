var q = {};
state( q, {
    A: state({
        data: { a: 'a' }
    }),
    X: state( 'abstract', {
        data: { x: 24 }
    })
});

var p = Object.create( q );
state( p, {
    A: state({
        AA: state.extend( 'X', {
            data: { aa: 'aa' }
        })
    }),
    Y: state( 'abstract', {
        data: { y: 25 }
    })
});

var o = Object.create( p );
state( o, {
    B: state.extend( 'X, Y', {
        data: { b: 'b' }
    })
});


o.state('-> AA');
o.data();           // >>> { aa: 'aa', x: 24, a: 'a' }
o.state('-> B');
o.data();           // >>> { b: 'b', x: 24, y: 25 }
