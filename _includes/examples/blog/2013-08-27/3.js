owner.m();                 // >>> "boop!"

owner.state('-> C');
owner.m();                 // >>> "beep!  blorp!"

owner.state('CA -> CAB');
owner.m();                 // >>> "beep! bleep! blorp!"