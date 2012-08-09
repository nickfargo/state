class Mover
  state @::
    Moving: state

Mover::state().mutate
  aMethod: ->
  Stationary: state

Mover::state 'Stationary'     # >>> undefined [1]

mover = new Mover
state mover, 'mutable'
mover.state().mutate
  aMethod: ->
  Stationary: state

mover.state '-> Stationary'   # >>> State 'Stationary'
mover.state().isMutable()     # >>> true [2], [3]

mover.state '-> Moving'       # >>> State 'Moving'
mover.state().isMutable()     # >>> true [3]