    { expect } = require 'chai'
    state = require 'state'

    { State, RootState } = state


    describe "Creating `State` implementations using the `state` function:", ->

      describe "Implementing state on an object", ->
        object = {}
        state object, null
        root = object.state ''

        it "adds a new `state` method to the object", ->
          expect( object ).to.have.ownProperty 'state'

        it "creates a new root state, whose name is the empty string", ->
          expect( root ).to.be.instanceof RootState

        it "sets the object’s current state to the root", ->
          expect( object.state() ).to.equal root


      describe "Prototypal state implementations:", ->
        class Class
          state @::, null

        describe "Implementing state for a constructor’s prototype", ->
          object = new Class

          it "exposes a `state` method to an instance", ->
            expect( object ).to.have.property 'state'

          it "does not create a `state` method for the instance", ->
            expect( object ).not.to.have.ownProperty 'state'

        describe "Side-effects of calling an inheritor’s `state` method", ->
          object = new Class
          do object.state
          root = object.state ''

          it "add a new own `state` method for the instance", ->
            expect( object ).to.have.ownProperty 'state'
            expect( object.state ).to.be.a.function

          it "create a new root state for the instance", ->
            expect( root ).to.be.instanceof RootState
            expect( root.owner ).to.equal object

          it "define a *protostate* relation between the two root states", ->
            expect( root.protostate ).to.equal Class::state('')


      describe "State tree declarations:", ->
        describe "Declaring a shallow tree of states for an object", ->
          object = {}
          state object,
            A: state
            B: state
          root = object.state ''

          it "creates a root state", ->
            expect( root ).to.be.instanceof RootState

          it "creates substates as children of the root", ->
            expect( a = root.substate 'A' ).to.be.instanceof State
            expect( a.superstate ).to.equal root
            expect( b = root.substate 'B' ).to.be.instanceof State
            expect( b.superstate ).to.equal root

          it "allows direct querying of substates by name", ->
            expect( a = object.state 'A' ).to.equal root.substate 'A'
            expect( b = object.state 'B' ).to.equal root.substate 'B'

        describe "Declaring a deep tree of states for an object", ->
          object = {}
          state object,
            A: state
            B: state
              BA: state
              BB: state
                BBA: state
          root = object.state ''

          it "creates chains of deeply nested descendant `State`s", ->
            expect( bba = object.state 'B.BB.BBA' ).to.be.instanceof State
            expect( bb = bba.superstate ).to.equal object.state 'B.BB'
            expect( b = bb.superstate ).to.equal object.state 'B'
            expect( b.superstate ).to.equal root
