function Mover() {}
state( Mover.prototype, {
    Moving: state('initial')
});

var mover = new Mover;
mover.state().owner === mover;  // >>> true
