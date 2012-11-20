question = null
answer = 42

# Calling `plain` here would throw a ReferenceError, as variables
# `autostate`, etc. do not exist.
plain = ( param ) ->
  return [ question, answer, param, autostate, protostate,
    superstate, owner ]

# Calling `state.method` returns a function closed over the
# provided bindings and `plain`, which will be called later to
# transform `plain` so that it too is closed over both the
# bindings and some relevant lexical `State` references.
lexical = state.method { question, answer }, plain


# The function held here by `lexical` in practice is typically
# held as the value of a `method` item within a `StateExpression`.
# Once a `State` instance is created from that state expression,
# it is ready to call `lexical` to produce the actual method
# that it will hold.
lexical = ( bindings, fn ) ->

  # When `lexical` is called, it generates a function similar to
  # `factory` as depicted below, and immediately invokes it with
  # arguments consisting of the provided bindings
  factory = ( question, answer, autostate, protostate ) ->
    
    # This is `fn`, wrapped, rewritten, and rescoped.
    ( param ) ->

      # Embedded dynamic references
      superstate = @superstate()
      owner = @owner()

      # Function body as provided
      return [ question, answer, param, autostate, protostate,
        superstate, owner ]

  factory(
    bindings.question,
    bindings.answer,
    this,
    this.protostate()
  )

# When a lexical method such as this is to be added to a `State`,
# it ...