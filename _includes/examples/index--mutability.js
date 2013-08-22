function Traveler () {}
Traveler.prototype = Object.create( Person );
Traveler.prototype.constructor = Traveler;

// A bit of behavior.
var theRomansDo = {
    Formal: {
        greet: function () { return "Quid agis?"; }
    },
    Casual: {
        greet: function () { return "Salve!"; }
    }
};

// Returns a boxed function that instills an enclosed behavior.
function doAs ( behavior ) {
    return state.bind( function () {
        this.mutate( behavior );
    });
}

state( Traveler.prototype, 'mutable abstract', {
    travelTo: state.bind( function ( place ) {
        this.emit( 'in' + place );
    }),

    events: {
        inRome: doAs( theRomansDo )
    },

    Formal: state('default')
});


var traveler = new Traveler;
traveler.greet();             // >>> "How do you do?"

traveler.travelTo('Rome');

traveler.greet();             // >>> "Quid agis?"
traveler.state('-> Casual');  // >>> State 'Casual'
traveler.greet();             // >>> "Salve!"