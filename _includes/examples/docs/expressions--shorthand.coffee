shorthandExpression = state
  greet: -> "Hello."
  Formal:
    enter: -> do @wearTux
    greet: -> "How do you do?"
  Casual:
    enter: -> do @wearJeans
    greet: -> "Hi!"
# >>> StateExpression