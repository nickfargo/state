state owner = {}, 'abstract',
  m: -> 'beep!'

  A: state 'initial',
    m: -> 'boop!'
  B: state
  C: state 'concurrent',

    # [1]
    m: state.bind ->

      # [2]
      inheritedResult = @superstate.apply 'm', arguments

      # [3]
      resultA = @query('CA').dispatch 'm', arguments
      resultB = @query('CB').dispatch 'm', arguments

      # [4]
      [ inheritedResult, resultA, resultB ].join ' '

    # [5]
    CA: state
      CAA: state 'initial'
      CAB: state
        m: -> 'bleep!'
    CB: state
      CBA: state 'initial',
        m: -> 'blorp!'
      CBB: state