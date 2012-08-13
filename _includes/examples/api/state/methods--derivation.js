var mover = {};
state( mover, {
    Moving: {
        Running: {
            Sprinting: state
        }
    }
});

var s = mover.state('Sprinting')
s.derivation();
// >>> [ State 'Moving', State 'Running', State 'Sprinting' ]
s.derivation( true );
// >>> [ "Moving", "Running", "Sprinting" ]