class Avenger
  constructor: ( @name ) ->

  greet: -> "Hello."

  state @::, 'abstract',
    Terse: state 'default'
    Verbose: state
      greet: state.bind ->
        "#{ @superstate.call 'greet' } My name is #{ @owner.name }..."


inigo = new Avenger 'Inigo'

inigo.state()              # >>> State 'Terse'
inigo.greet()              # >>> "Hello."

inigo.state '-> Verbose'   # >>> State 'Verbose'
inigo.greet()              # >>> "Hello. My name is Inigo..."
