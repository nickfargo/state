function Person () {}
state( Person.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
person.hasOwnProperty('state');   // >>> false

person.state('-> Formal');
person.state();                   // >>> State 'Formal'
person.greet();                   // >>> "How do you do?"