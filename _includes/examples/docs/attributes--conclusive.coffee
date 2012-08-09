class Mover
  state @::
    Stationary: state
    Moving: state 'conclusive'
      Walking: state
      Running: state

mover = new Mover
mover.state '-> Stationary'  # >>> State 'Stationary'
mover.state '-> Walking'     # >>> State 'Walking'
mover.state '-> Stationary'  # >>> null
mover.state '-> Running'     # >>> State 'Running'