    { expect } = require 'chai'
    state = require 'state'



    describe "Guards:", ->

      describe "a state guard", ->

        it "resolves across superstates", ->
          state o = {}, 'abstract',
            A: state 'initial',
              admit: ( fromState ) -> no
              AA: state
              AB: state
                admit: 'AA'
              AC: state
            B: state
              admit: 'A.*'
              release: '.*'
              BA: state

          o.state '-> AA'
          o.state '-> A'  ; expect( o.state().name ).to.equal 'AA'
          o.state '-> AB' ; expect( o.state().name ).to.equal 'AB'
          o.state '-> B'  ; expect( o.state().name ).to.equal 'B'
          o.state '-> AC' ; expect( o.state().name ).to.equal 'B'
          o.state '-> BA' ; expect( o.state().name ).to.equal 'BA'
          o.state '-> A'  ; expect( o.state().name ).to.equal 'BA'

        it "resolves across protostates", ->
          class Superclass
            state @::, 'abstract',
              A: state 'initial',
                admit: ( fromState ) -> no
              B: state
                release: ( toState ) -> yes if toState.name is 'D'
              C: state
              D: state

          class Class extends Superclass

          o = new Class
          o.state '-> B'
          o.state '-> A' ; expect( o.state().name ).to.equal 'B'
          o.state '-> C' ; expect( o.state().name ).to.equal 'B'
          o.state '-> D' ; expect( o.state().name ).to.equal 'D'
          o.state '-> A' ; expect( o.state().name ).to.equal 'D'

      describe "a transition guard", ->
