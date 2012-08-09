var mover = {};
state( mover, { Moving: { Running: { Sprinting: state } } } );

var s = mover.state('Sprinting');  // >>> State 'Sprinting'
s.isIn('Running');                 // >>> true