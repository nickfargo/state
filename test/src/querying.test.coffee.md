    { expect } = require 'chai'
    state = require 'state'

    { State, RootState } = state



    describe "Querying `State`s", ->

      describe "within an object’s state tree", ->
        object = {}
        state object,
          A: state
          B: state
            BA: state
            BB: state
              BBA: state
              BBB: state
          BBB: state

        root = object.state ''
        a = b = ba = bb = bba = null

        it "resolves top-level substates by name", ->
          expect( a = object.state 'A' ).to.be.instanceof State
          expect( a.superstate ).to.equal root
          expect( b = object.state 'B' ).to.be.instanceof State
          expect( b.superstate ).to.equal root

        it "resolves descendant substates by fully-qualified path", ->
          expect( ba = object.state 'B.BA' ).to.be.instanceof State
          expect( ba.superstate ).to.equal b
          expect( bb = object.state 'B.BB' ).to.be.instanceof State
          expect( bb.superstate ).to.equal b
          expect( bba = object.state 'B.BB.BBA' ).to.be.instanceof State
          expect( bba.superstate ).to.equal bb

        it "resolves non-ambiguously named descendants by name", ->
          bba = object.state 'B.BB.BBA'
          expect( object.state 'BBA' ).to.equal bba

        it "resolves absolute paths to ambiguously named descendants", ->
          bbb = object.state 'BBB'
          bb = object.state 'BB'
          expect( bbb.superstate ).to.equal root
          expect( bbb.superstate ).to.not.equal bb

        it "employs recursive descent to disambiguate relative paths", ->
          b = object.state 'B'
          path = '.BBB'
          expect( s1 = b.query path ).to.not.equal s2 = root.query path
          expect( s1.superstate.superstate.superstate ).to.equal s2.superstate

        it "employs recursive ascent", ->
          a = object.state 'A'
          bb = object.state 'BB'
          expect( bb.query '.A' ).to.equal a


      describe "across prototypes:", ->
        class Parent
          state @::,
            A: state
            B: state

        class Child
          state @::,
            B:
              BA: state
              BB:
                BBA: state

        describe "An inheritor", ->
          object = new Child

          it "initializes to a realized root state", ->
            current = object.state()
            expect( current ).to.be.instanceof RootState
            expect( current.isVirtual() ).to.equal no




    ###

      do ->
        class Class
          state @::,
            A: state
            B: state
              BA: state
              BB: state
                BBA: state

        describe "", ->

    ###
