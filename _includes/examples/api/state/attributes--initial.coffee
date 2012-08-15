class Mover
  state @::
    Stationary: state 'initial'
    Moving: state

mover1 = new Mover
mover1.state()                # >>> State 'Stationary'

Mover::state '-> Moving'
mover2 = new Mover
mover2.state()                # >>> State 'Moving'

mover3 = new Mover
state mover3,
  Stationary: state
  Moving:
    Walking: state
    Running: state 'initial'
mover3.state()                # >>> State 'Running'