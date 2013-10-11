var owner = {};
state( owner, {
    A: state,
    B: state
});

var root   = owner.state('');      // >>> RootState
var stateA = owner.state('A');     // >>> State 'A'
var stateB = owner.state('B');     // >>> State 'B'
