class Mover
  state @::,
    Stationary: state 'initial'
    Moving: state

var mover = new Mover

mover.state()               # >>> State 'Stationary'
mover.state().isVirtual()   # >>> true                          [1]

mover.state '->'
mover.state()               # >>> State ''
mover.state().isVirtual()   # >>> false                         [2]