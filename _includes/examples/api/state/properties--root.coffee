mover = {}
state mover,
  Moving:
    Running: state

mover.state().root          # >>> State ''
mover.state('').root        # >>> State ''
mover.state('Moving').root  # >>> State ''