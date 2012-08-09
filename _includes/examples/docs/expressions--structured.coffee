longformExpression = state
  methods:
    greet: -> "Hello."
  states:
    Formal:
      methods:
        greet: -> "How do you do?"
      events:
        enter: -> do @owner().wearTux
    Informal:
      methods:
        greet: -> "Hi!"
      events:
        enter: -> do @owner().wearJeans