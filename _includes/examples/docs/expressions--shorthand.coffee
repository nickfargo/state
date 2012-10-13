shorthandExpression = state
  greet: -> "Hello."
  Formal:
    enter: -> do @owner().wearTux
    greet: -> "How do you do?"
  Casual:
    enter: -> do @owner().wearJeans
    greet: -> "Hi!"
# >>> StateExpression