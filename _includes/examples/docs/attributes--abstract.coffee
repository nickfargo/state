class Mover
  state @::, 'abstract'
    Moving: state 'abstract'
      Walking: state
      Running: state

mover = new Mover
mover.state '->'         # >>> State 'Walking'
mover.state '-> Moving'  # >>> State 'Walking'