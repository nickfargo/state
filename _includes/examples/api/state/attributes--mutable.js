function Mover () {}
state( Mover.prototype, {
    Moving: state
});

Mover.prototype.state().mutate({
    aMethod: function () {},
    Stationary: state
});

Mover.prototype.state('Stationary');  // >>> undefined            [1]

var mover = new Mover;
state( mover, 'mutable' );
mover.state().mutate({
    aMethod: function () {},
    Stationary: state
});

mover.state('-> Stationary');
mover.state();                        // >>> State 'Stationary'
mover.state().isMutable();            // >>> true            [2], [3]

mover.state('-> Moving');
mover.state();                        // >>> State 'Moving'
mover.state().isMutable();            // >>> true                 [3]