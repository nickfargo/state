function Person () {}
state( Person.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; },
        
        Highbrow: {
            greet: function () { return "Enchanté."; }
        }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
var friend = new Person;

person.hasOwnProperty('state');   // >>> false

person.state('-> Highbrow');
friend.state('-> Casual');

person.greet();                   // >>> "Enchanté."
friend.greet();                   // >>> "Hi!"