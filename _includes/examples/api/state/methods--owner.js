function Mover () {}
state( Mover.prototype, {
    Moving: {
        getState: function () { return this; },
        getOwner: function () { return this.owner(); }
    }
});

var mover = new Mover;
mover.state('-> Moving');
mover.getState() === mover.state('Moving');  // >>> true
mover.getOwner() === mover                   // >>> true