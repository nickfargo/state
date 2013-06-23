mover = {}
state mover,
  Moving:
    Running:
      Sprinting: state

s = mover.state 'Moving'  # >>> State 'Moving'
s.has 'Sprinting'         # >>> true
s.has 'Moving'            # >>> true