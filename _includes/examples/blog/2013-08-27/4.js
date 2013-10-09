var owner = {};
state( owner, 'abstract', {
  m1: function () { return "beep!"; },

  A: state( 'initial', {
    m1: function () { return "boop!"; }
  }),
  B: state,
  C: state( 'concurrent orthogonal', {
    CA: state({
      CAA: state('initial'),
      CAB: state({
        m1: function () { return "bleep!"; }
      })
    }),
    CB: state({
      CBA: state( 'initial', {
        m2: function () { return "blorp!"; }
      }),
      CBB: state
    })
  })
});