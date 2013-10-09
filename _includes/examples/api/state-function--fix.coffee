class Superclass
  state @::,
    A:
      ask: ( question ) -> if not question? then answer: 42

class Class
  state @::,
    A:
      ask: state.fix ( autostate, protostate ) -> ( question ) ->
        protostate.call 'ask', question

o = new Class
o.state '-> A'
o.ask null  # >>> { answer: 42 }
