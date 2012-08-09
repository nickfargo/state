shoot = -> "pew!"
raygun = shoot: shoot

raygun.shoot is shoot                       # >>> true

state raygun,
  RapidFire:
    shoot: -> "pew pew pew!"

raygun.shoot is shoot                       # >>> false
raygun.shoot.isDelegator                    # >>> true
raygun.state('').method('shoot') is shoot   # >>> true

raygun.shoot()                              # >>> "pew!"
raygun.state '-> RapidFire'                 # >>> State 'RapidFire'
raygun.shoot()                              # >>> "pew pew pew!"