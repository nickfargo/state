var p = {};
state( p, {
    A: state,
    B: state({
        BA: state,
        BB: state
    })
});

var o = Object.create( p );
state( o, {
    A: state({
        AA: state.extend('X, Y')
    }),
    X: state,
    Y: state
});
