class Traveler extends Actor
  state @::, 'mutable abstract',
    travelTo: state.bind ( place ) -> @emit "in#{ place }"

    events:
      inRome: doAs theRomansDo

    Formal: state 'default'


traveler = new Traveler
traveler.greet()              # >>> "How do you do?"

traveler.travelTo 'Rome'

traveler.greet()              # >>> "Quid agis?"
traveler.state '-> Casual'    # >>> State 'Casual'
traveler.greet()              # >>> "Salve!"
