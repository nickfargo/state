    { expect } = require 'chai'
    state = require 'state'

    { env, bind, fix, State, RootState } = state

    { isEmpty, diff } = state.O



## Data

    describe "Data:", ->


### Setup

      class Superclass
        state @::, 'mutable',
          data: { a: 1, b: 'shadow me', d: 'shadow me' }
          A: state
            data: { b: 2, c: 'shadow me', e: 'shadow me' }
            AA: state
              data: { c: 3, f: 'shadow me' }
          X: state 'abstract',
            data: { x: 24, c: 'shadow me' }

      class Class extends Superclass
        state @::,
          data: { d: 4, e: 'shadow me', g: 'shadow me' }
          A: state
            data: { e: 5, f: 'shadow me', h: 'shadow me' }
            AA: state
              data: { f: 6, i: 'shadow me' }
          Y: state 'abstract',
            data: { f: 'shadow me', x: 'shadow me', y: 25 }

      instanceStateExpression =
        data: { g: 7 }
        A: state
          data: { h: 8 }
          AA: state.extend 'X, Y, Z', 'initial',
            data: { i: 9 }
        Z: state 'abstract',
          data: { z: 26 }

      expectation = a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,x:24,y:25,z:26



      describe "object model", ->

        it "is structured properly", ->
          state instance = new Class, instanceStateExpression

The instance should flatten (`virtualize().realize()`) proto-parastates into
its own state tree.

          expect( instance.state('X').owner ).to.equal instance
          expect( instance.state('X').protostate.owner ).to.equal Superclass::

          expect( instance.state('Y').owner ).to.equal instance
          expect( instance.state('Y').protostate.owner ).to.equal Class::

          expect( instance.state('Z').owner ).to.equal instance
          expect( instance.state('Z').protostate ).to.equal null



### Tests


#### data (read)

      describe "data (read):", ->

        it "performs proper inheritance and shadowing", ->
          state instance = new Class, instanceStateExpression
          residue = diff instance.state().data(), expectation
          expect( isEmpty residue ).to.equal yes


#### has

      describe "has:", ->

        it "has each expected key", ->
          state instance = new Class, instanceStateExpression
          for key, value of expectation
            expect( instance.state().has key ).to.equal yes


#### get

      describe "get:", ->

        it "gets each expected value", ->
          state instance = new Class, instanceStateExpression
          for key, value of expectation
            expect( instance.state().get key ).to.equal value


#### let

      describe "let:", ->

        it "writes to the receiving state, does not mutate ancestors", ->
          state instance = new Class, instanceStateExpression

          instance.state().let 'a', 'mutated a'
          expect( instance.state().get 'a' ).to.equal 'mutated a'
          expect( instance.state('').get 'a' ).to.equal 1

          instance.state().let 'x', 'mutated x'
          expect( instance.state().get 'x' ).to.equal 'mutated x'
          expect( instance.state('X').get 'x' ).to.equal 24


#### set

      describe "set:", ->

        it "mutates a property on site in state tree, not on protostate", ->
          state instance = new Class, instanceStateExpression

The `a` property is inherited via protostate, which `set` cannot mutate;
therefore the operation defaults to a `let` on the receiving `instance`.

          instance.state().set 'a', 'mutated a'
          expect( instance.state().get 'a' ).to.equal 'mutated a'
          expect( instance.state('').get 'a' ).to.equal 1
          expect( Superclass::state('').get 'a' ).to.equal 1

The `g` property is inherited via superstate, which `set` can mutate.

          instance.state().set 'g', 'mutated g'
          expect( instance.state('').get 'g' ).to.equal 'mutated g'

The `x` property is inherited via proto-parastate, which `set` cannot mutate.

          instance.state().set 'x', 'mutated x'
          expect( instance.state().get 'x' ).to.equal 'mutated x'
          expect( instance.state('X').get 'x' ).to.equal 24
          expect( Superclass::state('X').get 'x' ).to.equal 24

The `z` property is inherited via owned parastate, which `set` can mutate.

          instance.state().set 'z', 'mutated z'
          expect( instance.state().get 'z' ).to.equal 'mutated z'
          expect( instance.state('Z').get 'z' ).to.equal 'mutated z'
