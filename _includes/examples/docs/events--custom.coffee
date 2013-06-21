{ bind } = state

class Kid
  state @::
    Happy: state
    Sad: state

    events:
      gotIceCream: bind -> @be 'Happy'
      spilledIceCream: bind -> @be 'Sad'


jr = new Kid

jr.state().emit 'gotIceCream'
jr.state()                         # >>> State 'Happy'

jr.state().emit 'spilledIceCream'
jr.state()                         # >>> State 'Sad'