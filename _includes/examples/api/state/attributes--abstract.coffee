class Mover
  state @::, 'abstract',
    Moving: state 'abstract',
      Walking: state
      Running: state

mover = new Mover

mover.state '->'
mover.state()            # >>> State 'Walking'

mover.state '-> Moving'
mover.state()            # >>> State 'Walking'