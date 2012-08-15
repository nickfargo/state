function Mover () {}
state( Mover.prototype, 'abstract', {
    Stationary: state,
    Moving: state( 'default abstract', {
        Walking: state,
        Running: state('default')
    })
});

var mover = new Mover;
mover.state('->');         // >>> State 'Running'
mover.state('-> Moving');  // >>> State 'Running'