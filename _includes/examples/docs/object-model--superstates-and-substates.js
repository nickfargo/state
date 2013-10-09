var o = {};
state( o, {
    A: state({
        AA: state,
        AB: state
    }),
    B: state
});


var root = o.state('');                    // >>> RootState
o.state() === root;                        // >>> true
o.state('-> AA');
o.state() === o.state('AA');               // >>> true
o.state().superstate === o.state('A');     // >>> true
o.state().superstate.superstate === root;  // >>> true
