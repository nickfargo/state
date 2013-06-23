mover = {}
state mover,
  Moving:
    Running: state 'initial'

mover.state().name()  # >>> "Running"
mover.state().path()  # >>> "Moving.Running"