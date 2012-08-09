class Mover
  state @::,
    Moving:
      getState: -> this
      getOwner: -> @owner()

mover = new Mover
mover.state '-> Moving'
mover.getState() is mover.state('Moving')  # >>> true
mover.getOwner() is mover                  # >>> true