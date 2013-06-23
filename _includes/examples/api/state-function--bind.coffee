owner = {}
state owner,
  A:
    inherited: ( question ) -> if not question? then answer: 42
    AA:
      inherited: state.bind ( question ) ->
        @owner is owner  # >>> true
        @superstate.call 'inherited', question
      AAA: state 'initial'

owner.inherited null  # >>> { answer: 42 }
