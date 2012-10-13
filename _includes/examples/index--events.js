function Mover () {}
state( Mover.prototype, {

    // Use the root state’s `construct` event to programmatically
    // set up all of the states to log their transitional events.
    construct: function () {
        var states, events, s, e;
        states = [this].concat( this.substates( true ) );
        events = ['depart', 'exit', 'enter', 'arrive'];
        for ( s in states ) for ( e in events ) {
            ( function ( s, e ) {
                s.on( e, function () {
                    console.log( e + " " + this.name() );
                });
            }( s, e ) );
        }
    },

    Stationary: {
        Idle: state('initial'),
        Alert: state
    },
    Moving: {
        Walking: state,
        Running: {
            Sprinting: state
        }
    }
});


var m = new Mover;

m.state('-> Alert');
// log <<< "depart Idle"
// log <<< "exit Idle"
// log <<< "enter Alert"
// log <<< "arrive Alert"

m.state('-> Sprinting');
// log <<< "depart Alert"
// log <<< "exit Alert"
// log <<< "exit Stationary"
// log <<< "enter Moving"
// log <<< "enter Running"
// log <<< "enter Sprinting"
// log <<< "arrive Sprinting"