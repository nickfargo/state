owner = {}
state owner,
  A:
    ask: ( question ) -> if not question? then answer: 42
    AA:
      ask: state.bind ( question ) ->
        @owner is owner  # >>> true
        @superstate.call 'ask', question
      AAA: state 'initial'

owner.ask null  # >>> { answer: 42 }
