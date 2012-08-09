class Mover
  state @::
    Stationary: state
    Moving: state 'final'
      Walking: state

mover = new Mover
mover.state '-> Walking'       # >>> State 'Walking'
mover.state '-> Stationary'    # >>> State 'Stationary'
mover.state '-> Moving'        # >>> State 'Moving'
mover.state '-> Walking'       # >>> null
mover.state '-> Stationary'    # >>> null