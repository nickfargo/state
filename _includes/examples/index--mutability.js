var theRomansDo = {
    Formal: {
        greet: function () { return "Quid agis?"; }
    },
    Casual: {
        greet: function () { return "Salve!"; }
    }
};

function doAs ( behavior ) {
    return function () {
        return this.mutate( behavior );
    };
}


inherit( Traveler, Person );
function Traveler () {}
state( Traveler.prototype, 'mutable abstract', {
    goTo: function ( place ) {
        this.emit( 'in' + place );
    },

    events: {
        inRome: doAs( theRomansDo )
    },

    Formal: state('default')
});


var traveler = new Traveler;
traveler.greet();             // >>> "How do you do?"

traveler.goTo('Rome');

traveler.greet();             // >>> "Quid agis?"
traveler.state('-> Casual');
traveler.greet();             // >>> "Salve!"