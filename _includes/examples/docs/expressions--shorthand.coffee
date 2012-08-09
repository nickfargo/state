shorthandExpression = state
  greet: -> "Hello."
  Formal:
    enter: -> do @owner().wearTux
    greet: -> "How do you do?"
  Informal:
    enter: -> do @owner().wearJeans
    greet: -> "Hi!"