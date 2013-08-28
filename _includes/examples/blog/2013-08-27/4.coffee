state owner = {}, 'abstract',
  m1: -> 'beep!'

  A: state 'initial',
    m1: -> 'boop!'
  B: state
  C: state 'concurrent orthogonal',
    CA: state
      CAA: state 'initial'
      CAB: state
        m1: -> 'bleep!'
    CB: state
      CBA: state 'initial',
        m2: -> 'blorp!'
      CBB: state