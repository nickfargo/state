function Person () {}
state( Person.prototype, {
    Casual: {
        greet: function () { return "Hi!"; }
    },
    Formal: {
        greet: function () { return "How do you do?"; }
    }
});


var bloke = new Person;
var dandy = new Person;

// Instigate a transition to a particular State
bloke.state('-> Casual');   // >>> State 'Casual'
dandy.state('-> Formal');   // >>> State 'Formal'

bloke.greet();              // >>> "Hi!"
dandy.greet();              // >>> "How do you do?"