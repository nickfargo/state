class Person
  state @::,
    Casual:
      greet: -> "Hi!"
    Formal:
      greet: -> "How do you do?"


bloke = new Person
dandy = new Person

# Instigate a transition to a particular State
bloke.state '-> Casual'    # >>> State 'Casual'
dandy.state '-> Formal'    # >>> State 'Formal'

bloke.greet()              # >>> "Hi!"
dandy.greet()              # >>> "How do you do?"