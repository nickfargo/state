function Mover () {}
state( Mover.prototype, {
    Stationary: state('initial'),
    Moving: state
});

var mover1 = new Mover;
mover1.state();                      // >>> State 'Stationary'

Mover.prototype.state('-> Moving');
var mover2 = new Mover;
mover2.state();                      // >>> State 'Moving'

var mover3 = new Mover;
state( mover3, {
    Stationary: state,
    Moving: {
        Walking: state,
        Running: state('initial')
    }
});                                  // >>> State 'Running'