mover = {}
state mover, 'mutable abstract',
  Stationary: state 'initial default',
    move: -> "!"
  Moving:
    Walking:
      move: -> "step step"
    Running:
      move: -> "boing boing"
      Sprinting: state

# Add a 'report' method to each of the states.
for substate in mover.state('').substates true
  substate.addMethod 'report', ->
    console.log "I'm in state '#{ @name() }'"

mover.report()  # log <<< "I'm in state 'Stationary'"

# Express the root state.
expression = mover.state('').express()  # >>> Object

# Use `expression` to clone the state implementation of `mover` into
# some other unrelated object.
other = {}
state other, expression
other.report()  # log <<< "I'm in state 'Stationary'"