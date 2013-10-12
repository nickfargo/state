class Developer
  state @::, 'abstract',
    develop: -> @state '-> Seasoned'

    Juvenile: state 'initial',
      greet: -> "sup"
    Seasoned: state 'final',
      greet: -> "Hello."


dev = new Developer

dev.state()                    # >>> State 'Juvenile'
dev.greet()                    # >>> "sup"

do dev.develop

dev.state()                    # >>> State 'Seasoned'
dev.greet()                    # >>> "Hello."

dev.state '-> Juvenile'        # (No effect)

dev.state()                    # >>> State 'Seasoned'
dev.greet()                    # >>> "Hello."