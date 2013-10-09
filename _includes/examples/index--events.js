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
    }
});

// Set up each state to log its transitional events.
( function () {
    var states, eventNames, i, j;

    function bindEventToState ( e, s ) {
        function log () { console.log( e + " " + s.name ); }
        s.on( e, log );
    }

    states = Mover.prototype.state().root.descendants();
    eventNames = ['depart', 'exit', 'enter', 'arrive'];

    for ( i = 0; i < states.length; i++ ) {
        for ( j = 0; j < eventNames.length; j++ ) {
            bindEventToState( eventNames[j], states[i] );
        }
    }
}() );


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