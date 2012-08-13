function Mover () {}
state( Mover.prototype, 'mutable', {
    Moving: {
        Running: state
    }
});

var mover = new Mover;
mover.state('-> Moving');
var s = mover.state();     // >>> State 'Moving'
s.isVirtual();             // >>> true
s.realize();
s.isVirtual();             // >>> false