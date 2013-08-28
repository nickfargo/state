owner.state().name;         // >>> "A"
owner.m1();                 // >>> "boop!"
owner.m2();                 // >>> undefined (event 'noSuchMethod:m2')

owner.state('-> C')
owner.m1();                 // >>> "beep!"
owner.m2();                 // >>> "blorp!"

owner.state('CA -> CAB');
owner.m1();                 // >>> "bleep!"
owner.m2();                 // >>> "blorp!"