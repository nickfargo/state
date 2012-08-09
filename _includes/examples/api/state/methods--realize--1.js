function Mover () {}
state( Mover.prototype, 'mutable', { Moving: { Running: state } } );

var mover = new Mover;
var s = mover.state('-> Moving');  // >>> State 'Moving'
s.isVirtual();                     // >>> true
s.realize();
s.isVirtual();                     // >>> false