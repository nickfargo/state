var o = {};
state( o, {
    A: state({
        AA: state.extend('X, Y')
    }),
    X: state,
    Y: state
});
