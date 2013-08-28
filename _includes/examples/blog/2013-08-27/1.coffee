owner = {}
owner.m               # >>> undefined


state owner, 'abstract',
  m: -> 'beep!'

  A: state 'initial',
    m: -> 'boop!'

owner.state           # >>> [Function]
owner.m               # >>> [Function]
owner.m.isDispatcher  # >>> true

owner.state().name    # >>> "A"
owner.m()             # >>> "boop!"