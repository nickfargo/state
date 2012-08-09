function Mover () {}
state( Mover.prototype, 'abstract', {
    Moving: state( 'abstract', {
        Walking: state
    })
});

var mover = new Mover;
state( mover, {
    Moving: state('concrete')
});

mover.state('-> Moving');  // >>> State 'Moving'