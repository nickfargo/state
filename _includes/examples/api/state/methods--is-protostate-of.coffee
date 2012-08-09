class Animal
  state @::, 'abstract'
    Alive: state 'default'
    Dead: state

class Bird extends Animal

canary = new Bird         # >>> Bird

a = Animal::state()       # >>> State 'Alive'
b = Bird::state()         # >>> State 'Alive'
c = canary.state()        # >>> State 'Alive'
a.isProtostateOf c        # >>> true
b.isProtostateOf c        # >>> true [1]
a is b                    # >>> false [1]

canary.state '-> Dead'    # >>> State 'Dead'

a = Animal::state 'Dead'  # >>> State 'Dead'
b = Bird::state 'Dead'    # >>> State 'Dead'
c = canary.state()        # >>> State 'Dead'
a.isProtostateOf c        # >>> true
b.isProtostateOf c        # >>> false [2]
a is b                    # >>> true [2]