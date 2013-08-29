class Actor
  # Implement a state tree on the constructor’s prototype.
  state @::,
    Casual:
      greet: -> "Hi!"
    Formal:
      greet: -> "How do you do?"

# Instances will inherit states from the prototype’s state tree.
bloke = new Actor
dandy = new Actor

# Each instance independently transitions to a particular State.
bloke.state '-> Casual'    # >>> State 'Casual'
dandy.state '-> Formal'    # >>> State 'Formal'

# Method calls are dispatched to the current State’s method.
bloke.greet()              # >>> "Hi!"
dandy.greet()              # >>> "How do you do?"