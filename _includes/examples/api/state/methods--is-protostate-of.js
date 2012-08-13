function Animal () {}
state( Animal.prototype, 'abstract', {
    Alive: state('default'),
    Dead: state
});

O.inherit( Bird, Animal );
function Bird () {}


var canary, a, b, c;

canary = new Bird;                   // >>> Bird

a = Animal.prototype.state();        // >>> State 'Alive'
b = Bird.prototype.state();          // >>> State 'Alive'
c = canary.state();                  // >>> State 'Alive'
a.isProtostateOf( c );               // >>> true
b.isProtostateOf( c );               // >>> true [1]
a === b;                             // >>> false [1]

canary.state('-> Dead');
canary.state();                      // >>> State 'Dead'

a = Animal.prototype.state('Dead');  // >>> State 'Dead'
b = Bird.prototype.state('Dead');    // >>> State 'Dead'
c = canary.state();                  // >>> State 'Dead'
a.isProtostateOf( c );               // >>> true
b.isProtostateOf( c );               // >>> false [2]
a === b;                             // >>> true [2]