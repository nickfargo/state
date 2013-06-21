theRomansDo =
  Formal:
    greet: -> "Quid agis?"
  Casual:
    greet: -> "Salve!"

doAs = (behavior) -> state.bind -> @mutate behavior


class Traveler extends Person
  state @::, 'mutable abstract',
    goTo: state.bind (place) -> @emit "in#{place}"

    events:
      inRome: doAs theRomansDo

    Formal: state 'default'


traveler = new Traveler
traveler.greet()              # >>> "How do you do?"

traveler.goTo 'Rome'

traveler.greet()              # >>> "Quid agis?"
traveler.state '-> Casual'
traveler.greet()              # >>> "Salve!"
