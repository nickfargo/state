function Person () {}

state( Person.prototype, 'abstract', {
    Formal: state( 'initial default', {
        greet: function () { return "How do you do?"; }
    }),
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
person.state();             // >>> State 'Formal'
person.greet();             // >>> "How do you do?"

person.state('-> Casual');
person.state();             // >>> State 'Casual'
person.greet();             // >>> "Hi!"