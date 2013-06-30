function shoot () { return "pew!"; }
var raygun = { shoot: shoot };

// First, affirm the identity of the function serving as the `shoot`
// method of `raygun`.
raygun.shoot === shoot;                     // >>> true

// Make `raygun` stateful. Its initial state will be the root state.
state( raygun, {
    RapidFire: {
        shoot: function () {
            return "pew pew pew!";
        }
    }
});

// Demonstrate that the function serving as the `shoot` method of
// `raygun` has been changed, that it has been replaced with a new
// dispatcher method, and that the original has been moved to the
// root state and, since `raygun` is presently in that state, can be
// be called in the normal fashion.
raygun.shoot === shoot;                     // >>> false
raygun.shoot.isDispatcher;                  // >>> true
raygun.state('').method('shoot') === shoot; // >>> true
raygun.shoot();                             // >>> "pew!"

// Change `raygun` to the `RapidFire` state and demonstrate the
// difference in behavior.
raygun.state('-> RapidFire');
raygun.state();                             // >>> State 'RapidFire'
raygun.shoot();                             // >>> "pew pew pew!"