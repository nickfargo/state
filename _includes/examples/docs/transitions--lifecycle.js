function Mover () {}
state( Mover.prototype, {
    
    // Programmatically set up the root to log the transitional
    // events of all states
    construct: function () {
        var events, substates, i, j;
        events = ['depart', 'exit', 'enter', 'arrive'];
        substates = [this].concat( this.substates( true ) );
        for ( i in substates ) for ( j in events ) {
            ( function ( s, e ) {
                s.on( e, function () {
                    console.log this.name() + " " + e;
                });
            }( substates[i], events[j] ) );
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
    },

    transitions: {
        Announcing: {
            source: '*', target: '*',
            action: function () {
                var name = this.superstate().name() || "the root";
                this.end( "action of transition is at " + name );
            },
            end: function ( message ) { console.log( message ); }
        }
    }
});


var m = new Mover;

m.state('-> Alert');
// log <<< "depart Idle"
// log <<< "exit Idle"
// log <<< "action of transition is at Stationary"
// log <<< "enter Alert"
// log <<< "arrive Alert"

m.state('-> Sprinting');
// log <<< "depart Alert"
// log <<< "exit Alert"
// log <<< "exit Stationary"
// log <<< "action of transition is at the root state"
// log <<< "enter Moving"
// log <<< "enter Running"
// log <<< "enter Sprinting"
// log <<< "arrive Sprinting"