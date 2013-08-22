function Person () {}

// Implement a state tree on the constructor’s prototype.
state( Person.prototype, {
    Casual: {
        greet: function () { return "Hi!"; }
    },
    Formal: {
        greet: function () { return "How do you do?"; }
    }
});


// Constructor instances will inherit the prototype’s state tree.
var bloke = new Person;
var dandy = new Person;

// Each instance independently transitions to a particular State.
bloke.state('-> Casual');   // >>> State 'Casual'
dandy.state('-> Formal');   // >>> State 'Formal'

// Method calls are dispatched to the current State’s method.
bloke.greet();              // >>> "Hi!"
dandy.greet();              // >>> "How do you do?"