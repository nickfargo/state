function Developer () {}
state( Developer.prototype, 'abstract', {
    Juvenile: state( 'initial', {
        greet: function () { return "Sup."; }
    }),
    Mature: state( 'default final', {
        greet: function () { return "Hello."; }
    })
});


var person = new Developer;
person.state();                   // >>> State 'Juvenile'
person.greet();                   // >>> "Sup."

person.state('->');               // >>> State 'Mature'
person.greet();                   // >>> "Hello."

person.state('-> Juvenile');      // >>> State 'Mature'
person.greet();                   // >>> "Hello."