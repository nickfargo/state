    { expect } = require 'chai'
    O          = require 'omicron'
    state      = require 'state'

    { NIL } = O
    { State, Region, RootState, TransitionExpression } = state
    { ABSTRACT, CONCRETE } = State


    describe "Concurrency:", ->

      class Class
        state @::,
          A: state 'initial'
          B: state 'concurrent',
            BA: state.region
              BAA: state 'initial'
              BAB: state
            BB: state.region 'abstract',
              BBA: state
              BBB: state 'default'
