class Mover
  state @::, 'finite'
    Stationary: state
    Moving:
      Walking: state

mover = new Mover
state mover,
  Moving:
    Running: state 'mutable'

mover.state('Moving').isFinite()                # >>> true      [1]
mover.state('Running').isFinite()               # >>> true      [1]

mover.state('Running').addSubstate 'Sprinting'  # >>> undefined [2]