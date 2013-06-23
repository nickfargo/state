class Superclass
  state @::,
    A:
      inherited: ( question ) -> if not question? then answer: 42

class Class
  state @::,
    A:
      inherited: state.fix ( autostate, protostate ) -> ( question ) ->
        protostate.call 'inherited', question

o = new Class
o.state '-> A'
o.inherited null  # >>> { answer: 42 }
