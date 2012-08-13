function Mover () {}
state( Mover.prototype, 'abstract', {
    Moving: state( 'abstract', {
        Walking: state,
        Running: state
    })
});

var mover = new Mover;

mover.state('->');
mover.state();             // >>> State 'Walking'

mover.state('-> Moving');
mover.state();             // >>> State 'Walking'