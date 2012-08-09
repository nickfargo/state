class Kid
  state @::
    Happy: state()
    Sad: state()
    events:
      gotIceCream: -> @be 'Happy'
      spilledIceCream: -> @be 'Sad'

junior = new Kid

junior.state().emit 'gotIceCream'
junior.state()
# >>> State 'Happy'

junior.state().emit 'spilledIceCream'
junior.state()
# >>> State 'Sad'