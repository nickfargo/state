class Mover
  state @::, 'mutable',
    Moving:
      Running: state

mover = new Mover
mover.state '-> Moving'
s = mover.state()               # >>> State 'Moving'
s.isVirtual()                   # >>> true
s.realize()
s.isVirtual()                   # >>> false