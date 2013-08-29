player = {}
state player,
  Alive: state
    Stationary: state
      drawWeapon: ->
        @weapon.state '-> Sighted'
    Moving: state
      drawWeapon: ->
        @weapon.state '-> Drawn'
      Walking: state
      Running: state
        Sprinting: state
          drawWeapon: ->
            @weapon.state '-> Held'
  Dead: state
    enter: ->
      do @weapon.drop

weapon = {}
state weapon,
  drop: ->
    @state '-> Dropped'

  Stowed: state
  Holstered: state
  Held: state
    Drawn: state
      Sighted: state
  Dropped: state
    drop: -> # no-op
