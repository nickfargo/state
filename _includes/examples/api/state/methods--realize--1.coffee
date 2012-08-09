class Mover
  state @::, 'mutable', Moving: Running: state

mover = new Mover
s = mover.state '-> Moving'   # >>> State 'Moving'
s.isVirtual()                 # >>> true
s.realize()
s.isVirtual()                 # >>> false