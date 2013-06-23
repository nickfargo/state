class Mover
  state @::, 'abstract',
    Stationary: state
    Moving: state 'default abstract',
      Walking: state
      Running: state 'default'

mover = new Mover

mover.state '->'
mover.state()            # >>> State 'Running'

mover.state '-> Moving'
mover.state()            # >>> State 'Running'