var mover = {};
state( mover, {
    Moving: {
        Running: {
            Sprinting: state
        }
    }
});

mover.state('Sprinting').path();  // >>> "Moving.Running.Sprinting"