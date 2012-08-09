function Mover () {}
state( Mover.prototype, 'abstract', {
    Moving: state( 'abstract', {
        Walking: state,
        Running: state
    })
});

var mover = new Mover;
mover.state('->');         // >>> State 'Walking'
mover.state('-> Moving');  // >>> State 'Walking'