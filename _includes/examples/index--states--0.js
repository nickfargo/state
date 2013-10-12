var owner = {};
state( owner, {
    A: state({
        aMethod: function () { return "alpha"; }
    }),
    B: state({
        aMethod: function () { return "beta"; }
    })
});

var root   = owner.state('');      // >>> RootState
var stateA = owner.state('A');     // >>> State 'A'
var stateB = owner.state('B');     // >>> State 'B'
