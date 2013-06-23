class Mover
  state @::,
    Stationary: state
    Moving: state 'final',
      Walking: state

mover = new Mover

mover.state '-> Walking'
mover.state()                  # >>> State 'Walking'

mover.state '-> Stationary'
mover.state()                  # >>> State 'Stationary'

mover.state '-> Moving'
mover.state()                  # >>> State 'Moving'

mover.state '-> Walking'
mover.state()                  # >>> State 'Moving'

mover.state '-> Stationary'
mover.state()                  # >>> State 'Moving'