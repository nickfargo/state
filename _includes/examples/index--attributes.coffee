class Developer
  state @::, 'abstract',
    develop: -> @state '-> Seasoned'

    Juvenile: state 'initial',
      greet: -> "Sup brah"
    Seasoned: state 'final',
      greet: -> "Hello."


dev = new Developer

dev.state()                    # >>> State 'Juvenile'
dev.greet()                    # >>> "Sup brah"

do dev.develop

dev.state()                    # >>> State 'Seasoned'
dev.greet()                    # >>> "Hello."

dev.state '-> Juvenile'        # (No effect)

dev.state()                    # >>> State 'Seasoned'
dev.greet()                    # >>> "Hello."