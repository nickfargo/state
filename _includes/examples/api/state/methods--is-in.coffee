mover = {}
state mover,
  Moving:
    Running:
      Sprinting: state

s = mover.state 'Sprinting'  # >>> State 'Sprinting'
s.isIn 'Running'             # >>> true