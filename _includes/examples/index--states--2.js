owner.state('-> A');
owner.state() === stateA;          // >>> true

owner.state('-> B');
owner.state() === stateB;          // >>> true

owner.state('->');
owner.state() === root;            // >>> true

owner.state().owner === owner;     // >>> true (invariant)
owner.state().root === root;       // >>> true (invariant)
