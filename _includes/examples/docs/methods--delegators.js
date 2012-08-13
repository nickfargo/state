var shoot = function () { return "pew!"; },
    raygun = { shoot: shoot };

raygun.shoot === shoot;                     // >>> true

state( raygun, {
    RapidFire: {
        shoot: function () {
            return "pew pew pew!";
        }
    }
});

raygun.shoot === shoot;                     // >>> false
raygun.shoot.isDelegator;                   // >>> true
raygun.state('').method('shoot') === shoot  // >>> true

raygun.shoot();                             // >>> "pew!"
raygun.state('-> RapidFire');
raygun.state();                             // >>> State 'RapidFire'
raygun.shoot();                             // >>> "pew pew pew!"