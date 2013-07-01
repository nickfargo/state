class Class extends Superclass
  baz: "BAZ"
  state @::,
    A:
      m: -> @baz
      AA:
        m: state.fix ( autostate, protostate ) -> state.bind ->
          protostate.call('m') + @superstate.call('m')