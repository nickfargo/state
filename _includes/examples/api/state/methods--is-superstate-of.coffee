mover = {}
state mover,
  Moving:
    Running:
      Sprinting: state

s = mover.state 'Moving'      # >>> State 'Moving'
s.isSuperstateOf 'Sprinting'  # >>> true
s.isSuperstateOf 'Moving'     # >>> false