class Traveler extends Actor
  state @::, 'mutable',
    travelTo: state.bind ( place ) -> @emit "in#{ place }"
    events:
      inRome: doAs theRomansDo


traveler = new Traveler
traveler.greet()              # >>> "How do you do?"

traveler.travelTo 'Rome'

traveler.greet()              # >>> "Quid agis?"
traveler.state '-> Casual'    # >>> State 'Casual'
traveler.greet()              # >>> "Salve!"
