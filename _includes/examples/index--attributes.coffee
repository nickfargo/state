class Developer
  state @::, 'abstract',
    develop: -> @state '-> Mature'

    Juvenile: state 'initial',
      greet: -> "Sup."
    Mature: state 'final',
      greet: -> "Hello."


dev = new Developer

dev.state()                    # >>> State 'Juvenile'
dev.greet()                    # >>> "Sup."

do dev.develop

dev.state()                    # >>> State 'Mature'
dev.greet()                    # >>> "Hello."

dev.state '-> Juvenile'        # (No effect)

dev.state()                    # >>> State 'Mature'
dev.greet()                    # >>> "Hello."