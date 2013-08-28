var owner = {};
state( owner, 'abstract', {
  m: function () { return 'beep!'; },

  A: state( 'initial', {
    m: function () { return 'boop!'; }
  }),
  B: state,
  C: state( 'concurrent', {

    // [1]
    m: state.bind( function () {

      // [2]
      var inheritedResult = this.superstate.apply( 'm', arguments );

      // [3]
      var resultA = this.query('CA').dispatch( 'm', arguments );
      var resultB = this.query('CB').dispatch( 'm', arguments );

      // [4]
      return [ inheritedResult, resultA, resultB ].join(' ');
    },

    // [5]
    CA: state({
      CAA: state('initial'),
      CAB: state({
        m: function () { return 'bleep!'; }
      })
    }),
    CB: state({
      CBA: state( 'initial', {
        m: function () { return 'blorp!'; }
      }),
      CBB: state
    })
  })
});