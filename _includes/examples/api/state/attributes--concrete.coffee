class Mover
  state @::, 'abstract',
    Moving: state 'abstract',
      Walking: state

mover = new Mover
state mover,
  Moving: state 'concrete'

mover.state '-> Moving'
mover.state()            # >>> State 'Moving'