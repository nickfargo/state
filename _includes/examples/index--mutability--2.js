function Actor () {}
state( Actor.prototype, 'abstract', {
    Casual: state({
        greet: function () { return "Hi!"; }
    }),
    Formal: state( 'default', {
        greet: function () { return "How do you do?"; }
    })
});

function Traveler () {}
Traveler.prototype = Object.create( Actor );
Traveler.prototype.constructor = Traveler;
state( Traveler.prototype, 'mutable', {
    travelTo: state.bind( function ( place ) {
        this.emit( 'in' + place );
    }),
    events: {
        inRome: doAs( theRomansDo )
    }
});


var traveler = new Traveler;
traveler.greet();             // >>> "How do you do?"

traveler.travelTo('Rome');

traveler.greet();             // >>> "Quid agis?"
traveler.state('-> Casual');  // >>> State 'Casual'
traveler.greet();             // >>> "Salve!"
