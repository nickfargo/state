longformExpression = state
  methods:
    greet: -> "Hello."
  states:
    Formal:
      methods:
        greet: -> "How do you do?"
      events:
        enter: -> do @wearTux
    Casual:
      methods:
        greet: -> "Hi!"
      events:
        enter: -> do @wearJeans
# >>> StateExpression