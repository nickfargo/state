function Mover () {}
state( Mover.prototype, {
    Stationary: state,
    Moving: state( 'conclusive', {
        Walking: state,
        Running: state
    })
});

var mover = new Mover;
mover.state('-> Stationary');  // >>> State 'Stationary'
mover.state('-> Walking');     // >>> State 'Walking'
mover.state('-> Stationary');  // null
mover.state('-> Running');     // >>> State 'Running'