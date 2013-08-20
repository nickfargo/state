class Developer
  state @::, 'abstract',
    Juvenile: state 'initial',
      greet: -> "Sup."
    Mature: state 'default final',
      greet: -> "Hello."


person = new Developer
person.state()                    # >>> State 'Juvenile'
person.greet()                    # >>> "Sup."

person.state '->'                 # >>> State 'Mature'
person.greet()                    # >>> "Hello."

person.state '-> Juvenile'        # >>> State 'Mature'
person.greet()                    # >>> "Hello."