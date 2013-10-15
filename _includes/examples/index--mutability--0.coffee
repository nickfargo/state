class Actor
  state @::, 'abstract',
    Casual: state
      greet: -> "Hi!"
    Formal: state 'default',
      greet: -> "How do you do?"
