class Mover
  state @::,
    Moving: state 'initial'

mover = new Mover
mover.state().owner is mover  # >>> true
