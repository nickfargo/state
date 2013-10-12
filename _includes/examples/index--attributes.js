function Developer () {}

state( Developer.prototype, 'abstract', {
    develop: function () { this.state('-> Seasoned'); },

    Juvenile: state( 'initial', {
        greet: function () { return "Sup brah"; }
    }),
    Seasoned: state( 'final', {
        greet: function () { return "Hello."; }
    })
});


var dev = new Developer;

dev.state();                   // >>> State 'Juvenile'
dev.greet();                   // >>> "Sup brah"

dev.develop();

dev.state();                   // >>> State 'Seasoned'
dev.greet();                   // >>> "Hello."

dev.state('-> Juvenile');      // (No effect)

dev.state();                   // >>> State 'Seasoned'
dev.greet();                   // >>> "Hello."