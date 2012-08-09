s = mover.state '-> Running'  # >>> State 'Running'
s.isVirtual()                 # >>> true
s.addMethod 'move', -> "Boing"
s.isVirtual()                 # >>> false