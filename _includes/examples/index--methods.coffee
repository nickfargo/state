class Avenger
  constructor: ( @name ) ->

  greet: -> "Hello."

  state @::, 'abstract',
    Terse: state 'default'
    Verbose: state
      greet: state.bind ->
        "#{ @superstate.call 'greet' } My name is #{ @owner.name }..."


person = new Avenger 'Inigo'
person.state()              # >>> State 'Terse'
person.greet()              # >>> "Hello."

person.state '-> Verbose'   # >>> State 'Verbose'
person.greet()              # >>> "Hello. My name is Inigo..."
