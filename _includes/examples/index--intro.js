var state = require('state');

var person = {};
state( person, {
    Formal: {
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        greet: function () { return "Hi!"; }
    }
};


person.hasOwnProperty('state');   // >>> true

person.state('-> Formal');
person.state();                   // >>> State 'Formal'
person.greet();                   // >>> "How do you do?"

person.state('-> Casual');
person.state();                   // >>> State 'Casual'
person.greet();                   // >>> "Hi!"