mover = {}
state mover
  Moving:
    Running: state

mover.state('Running').depth()  # >>> 2
mover.state('').depth()         # >>> 0