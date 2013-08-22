class Mover
  state @::
    Stationary: state
    Moving:
      Walking: state
      Running:
        Sprinting: state 'initial'

mover = new Mover
protostate = Mover::state()             # >>> State 'Sprinting'
epistate = mover.state()                # >>> State 'Sprinting'

protostate is epistate                  # >>> false
protostate is epistate.getProtostate()  # >>> true