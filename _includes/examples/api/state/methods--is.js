var mover = {};
state( mover, {
    Moving: {
        Running: {
            Sprinting: state
        }
    }
});

var s = mover.state('Sprinting');  // >>> State 'Sprinting'
s.is('Moving.Running.Sprinting');  // >>> true