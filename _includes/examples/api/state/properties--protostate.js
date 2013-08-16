function Mover () {}
state( Mover.prototype, {
    Moving: {
        Running: state('initial')
    }
});

var mover = new Mover;
mover.state().name;              // >>> 'Running'
mover.state().protostate;        // >>> State 'Running'
mover.state().protostate.owner;  // >>> Mover.prototype
