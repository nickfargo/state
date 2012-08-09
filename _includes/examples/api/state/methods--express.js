var mover = {};
state( mover, 'mutable abstract', {
    Stationary: state( 'initial default', {
        move: function () { return "!"; }
    }),
    Moving: {
        Walking: {
            move: function () { return "step step"; }
        },
        Running: {
            move: function () { return "boing boing"; },
            Sprinting: state
        }
    }
});

// Add a 'report' method to each of the four states.
O.forEach( mover.state('').substates( true ), function ( substate ) {
    substate.addMethod( 'report', function () {
        console.log( "I'm in state '" + this.name() + "'" );
    });
});
mover.report();  // log <<< "I'm in state 'Stationary'"

// Express the root state.
var expression = mover.state('').express();  // >>> Object

// Use `expression` to clone the state implementation of `mover` into
// some other unrelated object.
var other = {};
state( other, expression );
other.report();  // log <<< "I'm in state 'Stationary'"