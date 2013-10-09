owner.state();                     // >>> RootState
owner.state() === root;            // >>> true
owner.state() === root.current();  // >>> true (invariant)
