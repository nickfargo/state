var owner = {};
owner.m;               // >>> undefined


state( owner, 'abstract', {
  m: function () { return "beep!"; },

  A: state( 'initial', {
    m: function () { return "boop!"; }
  })
});

owner.state;           // >>> [Function]
owner.m;               // >>> [Function]
owner.m.isDispatcher;  // >>> true

owner.state().name     // >>> "A"
owner.m();             // >>> "boop!"