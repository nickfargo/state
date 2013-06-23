var mover = {};
state( mover, {
    Moving: {
        Running: state
    }
});

mover.state('Running').superstate();  // >>> State 'Moving'
mover.state('Moving').superstate();   // >>> State ''
mover.state('').superstate();         // >>> undefined