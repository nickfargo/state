mover = {}
state mover,
  Stationary: state
  Moving:
    Walking: state
    Running:
      Sprinting: state

mover.state('Sprinting').common 'Walking'  # >>> State 'Moving'