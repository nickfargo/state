
class Traveler extends Person

  # A bit of behavior.
  theRomansDo =
    Casual:
      greet: -> "Salve!"
    Formal:
      greet: -> "Quid agis?"

  # Returns a boxed function that instills an enclosed behavior.
  doAs = (behavior) -> state.bind -> @mutate behavior; return

  state @::, 'mutable abstract',
    travelTo: state.bind (place) -> @emit "in#{place}"

    events:
      inRome: doAs theRomansDo

    Formal: state 'default'


traveler = new Traveler
traveler.greet()              # >>> "How do you do?"

traveler.travelTo 'Rome'

traveler.greet()              # >>> "Quid agis?"
traveler.state '-> Casual'    # >>> State 'Casual'
traveler.greet()              # >>> "Salve!"
