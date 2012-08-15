class Mover
  state @::, 'immutable'
    Moving: state

mover = new Mover
state mover, 'mutable'                      # [1]
  Stationary: state                         # [2]

mover.state('').isMutable()                 # >>> false [1]
mover.state('Stationary').isMutable()       # >>> false [2]

mover.state().addMethod 'thisWontWork', ->  # >>> undefined [3]