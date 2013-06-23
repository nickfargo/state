class Mover
  state @::,
    Stationary: state
    Moving: state 'conclusive',
      Walking: state
      Running: state

mover = new Mover

mover.state '-> Stationary'
mover.state()                # >>> State 'Stationary'

mover.state '-> Walking'
mover.state()                # >>> State 'Walking'

mover.state '-> Stationary'
mover.state()                # >>> State 'Walking'

mover.state '-> Running'
mover.state()                # >>> State 'Running'