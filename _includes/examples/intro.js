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
person.greet();             // >>> "How do you do?"

person.state('-> Casual');
person.greet();             // >>> "Hi!"