function Mover () {}
state( Mover.prototype, {

    Stationary: {
        Idle: state('initial'),
        Alert: state
    },
    Moving: {
        Walking: state,
        Running: {
            Sprinting: state
        }
    },

    // Use the root state’s `construct` event to programmatically
    // set up all of the states to log their transitional events.
    construct: state.bind( function () {
        var states, events, s, e, i, ls, j, le;

        function bindEventToState ( e, s ) {
            s.on( e, state.bind( function () {
                console.log( e + " " + this.name );
            }));
        }

        states = [ this ].concat( this.substates( true ) );
        events = ['depart', 'exit', 'enter', 'arrive'];

        for ( i = 0, ls = states.length; i < ls; i++ ) {
            s = states[i];
            for ( j = 0, le = events.length; j < le; j++ ) {
                e = events[j];
                bindEventToState( e, s );
            }
        }
    })
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