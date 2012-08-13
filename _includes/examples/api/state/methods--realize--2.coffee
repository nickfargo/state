mover.state '-> Running'
s = mover.state()               # >>> State 'Running'
s.isVirtual()                   # >>> true
s.addMethod 'move', -> "Boing"
s.isVirtual()                   # >>> false