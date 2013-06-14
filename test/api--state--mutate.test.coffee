{ O, env, State, RootState } = state = require '../'
{ expect } = require 'chai'



describe "`State::mutate`", ->
  { NIL } = O

  unit =
    expression: state 'mutable'

    mutations: [
      A: state 'initial'
      B: state 'abstract'
    ,
      A:
        AA: state
      B: state
        BA: state
        BB: state 'default'
    ,
      A:
        AA:
          m: -> 'A.AA'
      B:
        m: -> 'B'
    ,
      A:
        data:
          a: 42
    ,
      A:
        data:
          a: NIL
    ,
      states:
        A: NIL
        B: NIL
    ]

    expectations: [
      (o) ->
        o.state('A') and
        o.state('A').isInitial() and
        o.state('B')

      (o) ->
        o.state('A') and
        o.state('A.AA') and
        o.state('B') and
        o.state('B').isAbstract() and
        o.state('B.BA') and
        o.state('B.BB') and
        o.state('B.BB').isDefault()

      (o) ->
        o.state('A.AA').method('m') and
        o.state('B').method('m')

      (o) ->
        o.state('A')?.has('a') and
        o.state('A').get('a') is 42

      (o) ->
        o.state('A')?.has('a') is false

      (o) ->
        o.state('')? and
        !o.state('A')? and
        !o.state('B')?
    ]


  o = {}
  state o, unit.expression
  for mutation, index in unit.mutations
    do ( mutation, index ) ->
      it "performed mutation #{ index } properly", ->
        o.state('').mutate mutation
        expect( unit.expectations[ index ] o ).to.be.ok


