function Person () {}
state( Person.prototype, 'abstract', {
    Formal: state( 'default initial', {
        greet: function () { return "How do you do?"; }
    }),
    Casual: state( 'final', {
        greet: function () { return "Hi!"; }
    })
});


var person = new Person;

person.greet();                   // >>> "How do you do?"

person.state('->');
person.state();                   // >>> State 'Formal'
person.greet();                   // >>> "How do you do?"

person.state('-> Casual')
person.greet();                   // >>> "Hi!"

person.state('-> Formal')
person.state();                   // >>> State 'Casual'