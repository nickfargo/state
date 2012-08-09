var NIL = O.NIL;

var mover = {};
state( mover, 'mutable', {
    mutate: function () {
        console.log( "I feel different" );
    },
    Stationary: state,
    Evil: state
});

// Update `Stationary`, create `Moving`, and delete `Evil`
mover.state('').mutate({
    Stationary: {
        move: function () { return "!"; }
    },
    Moving: {
        Walking: state,
        Running: state
    },
    Evil: NIL
});
// log <<< "I feel different"