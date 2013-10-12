owner.state('-> A');
owner.state() === stateA;          // >>> true
owner.aMethod();                   // >>> "alpha"

owner.state('-> B');
owner.state() === stateB;          // >>> true
owner.aMethod();                   // >>> "beta"

owner.state('->');
owner.state() === root;            // >>> true
owner.aMethod();                   // >>> undefined

owner.state().owner === owner;     // >>> true (invariant)
owner.state().root === root;       // >>> true (invariant)
