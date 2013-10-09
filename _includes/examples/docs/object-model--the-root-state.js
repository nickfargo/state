owner.state().root === owner.state('');   // >>> true (invariant)
owner.state('->');
owner.state();                            // >>> State ''