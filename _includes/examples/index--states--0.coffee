state owner = {},
  A: state
    aMethod: -> "alpha"
  B: state
    aMethod: -> "beta"

root   = owner.state ''          # >>> RootState
stateA = owner.state 'A'         # >>> State 'A'
stateB = owner.state 'B'         # >>> State 'B'
