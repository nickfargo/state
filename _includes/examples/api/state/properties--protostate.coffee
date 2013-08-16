class Mover
  state @::,
    Moving:
      Running: state 'initial'

mover = new Mover
mover.state().name              # >>> 'Running'
mover.state().protostate        # >>> State 'Running'
mover.state().protostate.owner  # >>> Mover.prototype
