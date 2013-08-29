class Player
  constructor: ->
    @health = 100
    @weapon = new Weapon

  state @::, 'abstract',
    Alive: state 'default',
      setHealth: ( value ) ->
        if 0 < value then @health = value
        else @health = 0; @state '-> Dead'

      pickUpWeapon: ( weapon ) ->
        do @dropWeapon
      dropWeapon: ->
        @weapon.state '-> Dropped'
        @weapon = null

      Stationary: state
        drawWeapon: ->
          @weapon.state '-> Sighted'
      Moving: state 'abstract',
        drawWeapon: ->
          @weapon.state '-> Drawn'
        Walking: state
        Running: state 'default'
          Sprinting: state
            drawWeapon: ->
              @weapon.state '-> Held'
    Dead: state 'final',
      enter: ->
        do @dropWeapon

class Weapon
  state @::,
    Stowed: state
    Holstered: state
    Held: state
      Drawn: state
        Sighted: state
    Dropped: state
