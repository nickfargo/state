mover = {}
state mover, 'abstract'
  Stationary: state
  Moving: state 'default abstract'
    Walking: state
    Running:
      Sprinting: state 'initial'

mover.state('').defaultSubstate()        # >>> State 'Moving' [1]
mover.state('Moving').defaultSubstate()  # >>> State 'Walking' [2]

mover.state()     # >>> State 'Sprinting'
mover.state '->'  # >>> State 'Walking' [3]