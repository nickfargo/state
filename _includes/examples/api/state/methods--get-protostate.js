function Mover () {}
state( Mover.prototype, {
    Stationary: state,
    Moving: {
        Walking: state,
        Running: {
            Sprinting: state('initial')
        }
    }
});

var mover, protostate, epistate;
mover = new Mover;
protostate = Mover.prototype.state();     // >>> State 'Sprinting'
epistate = mover.state();                 // >>> State 'Sprinting'

protostate === epistate;                  // >>> false
protostate === epistate.getProtostate();  // >>> true