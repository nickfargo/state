{NIL} = O

mover = {}
state mover, 'mutable'
  mutate: -> console.log "I feel different"
  Stationary: state
  Evil: state

# Update `Stationary`, create `Moving`, and delete `Evil`
mover.state('').mutate
  Stationary: move: -> "!"
  Moving:
    Walking: state
    Running: state
  Evil: NIL
# log <<< "I feel different"