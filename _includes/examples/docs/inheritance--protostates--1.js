function Person () {}
Person.prototype.greet = function () { return "Hello."; };
state( Person.prototype, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
});

var person = new Person;
'state' in person;                 // >>> true
person.hasOwnProperty('state');    // >>> false