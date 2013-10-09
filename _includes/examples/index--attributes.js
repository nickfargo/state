function Developer () {}

state( Developer.prototype, 'abstract', {
    develop: function () { this.state('-> Mature'); },

    Juvenile: state( 'initial', {
        greet: function () { return "Sup."; }
    }),
    Mature: state( 'final', {
        greet: function () { return "Hello."; }
    })
});


var dev = new Developer;

dev.state();                   // >>> State 'Juvenile'
dev.greet();                   // >>> "Sup."

dev.develop();

dev.state();                   // >>> State 'Mature'
dev.greet();                   // >>> "Hello."

dev.state('-> Juvenile');      // (No effect)

dev.state();                   // >>> State 'Mature'
dev.greet();                   // >>> "Hello."