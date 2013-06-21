object = {}
state object,
  A: state 'initial',
    admit: false
    release: D: false
  B: state 'mutable',
    admit: false
    release:
      'C, D': true
      'C.**': false
    data: bleep: 'bleep'
  C:
    data: blorp: 'blorp'
    C1:
      C1a: state
    C2: state
  D:
    enter: -> @state('B').removeGuard 'admit'
    admit: ( fromState ) -> 'blorp' of fromState.data()
    release: ( toState ) -> 'bleep' of toState.data()