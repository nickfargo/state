class Kid
  state @::
    Happy: state
    Sad: state

    events:
      gotIceCream: -> @be 'Happy'
      spilledIceCream: -> @be 'Sad'


jr = new Kid

jr.state().emit 'gotIceCream'
jr.state()                         # >>> State 'Happy'

jr.state().emit 'spilledIceCream'
jr.state()                         # >>> State 'Sad'