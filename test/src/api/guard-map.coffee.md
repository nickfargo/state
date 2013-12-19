    { expect } = require 'chai'
    state = require 'state'

    { GuardMap } = state
    { VIA_PROTO } = state.TRAVERSAL_FLAGS


    truePredicate = -> yes
    falsePredicate = -> no



## [GuardMap]()



### [Constructor]()

    describe "GuardMap constructor", ->

      describe "with an object-typed `expression` argument:", ->
        gm = new GuardMap 'aGuardType', expression =
          aSelector: [
            truePredicate
            truePredicate
            truePredicate
          ]
          anotherSelector: truePredicate

        it "writes to `guardType`", ->
          expect( gm.guardType ).to.equal 'aGuardType'

        it "writes the interpreted `expression` to `this.map`", ->
          expect( Object.keys( gm.map ).join ' ' )
            .to.equal 'aSelector anotherSelector'

        it "boxes a function value inside an array", ->
          expect( gm.map.aSelector ).to.have.length 3
          expect( gm.map.anotherSelector ).to.have.length 1

      describe "with a string `expression`:", ->
        gm = new GuardMap 'aGuardType', expression = 'justAString'

        it "interprets the string as a selector and true predicate", ->
          expect( gm.guardType ).to.equal 'aGuardType'
          expect( gm.map.justAString ).to.have.length 1
          expect( gm.map.justAString[0]() ).to.equal true

      describe "with a function `expression`:", ->
        gm = new GuardMap 'aGuardType', expression = -> 42

        it "associates with the any-state selector", ->
          expect( gm.map['***'] ).to.exist

        it "instates the provided function as the lone predicate", ->
          expect( gm.map['***'] ).to.have.length 1
          expect( gm.map['***'][0]() ).to.equal 42 # truthy ok

      describe "with an array `expression`:", ->
        gm = new GuardMap 'aGuardType', expression = [
          'everything here must be coerced'
          /^into predicates$/
          that = true
        ]

        it "associates with the any-state selector", ->
          expect( gm.guardType ).to.equal 'aGuardType'
          expect( gm.map['***'] ).to.have.length 3

        it "coerces elements to true predicates", ->
          expect( typeof gm.map['***'][0] ).to.equal 'function'
          truePredicate = gm.map['***'][0]
          expect( p ).to.equal truePredicate for p in gm.map['***']

      describe "with any other type of `expression`:", ->
        gm = new GuardMap 'aGuardType', expression = 0

        it "associates with the any-state selector", ->
          expect( gm.guardType ).to.equal 'aGuardType'
          expect( gm.map['***'] ).to.have.length 1

        it "converts the value to a predicate thunk", ->
          expect( gm.map['***'][0]() ).to.equal false



### [Methods]()


#### [add]()

    describe "GuardMap::add", ->


      it "writes arguments to `map` property", ->
        guardMap = new GuardMap 'aGuardType'
        guardMap.add 'A', [ truePredicate, falsePredicate ]

        expect( guardMap.guardType ).to.equal 'aGuardType'
        expect( guardMap.map.A ).to.be.an.array
        expect( guardMap.map.A ).to.have.length 2
        expect( guardMap.map.A[0] ).to.equal truePredicate
        expect( guardMap.map.A[1] ).to.equal falsePredicate


      it "writes function-typed `predicates` argument as array", ->
        guardMap = new GuardMap 'aGuardType'
        guardMap.add 'A', truePredicate
        expect( guardMap.map.A ).to.be.an.array
        expect( guardMap.map.A ).to.have.length 1
        expect( guardMap.map.A[0] ).to.equal truePredicate



#### [remove]()

    describe "GuardMap::remove", ->



#### [evaluate]()

    describe "GuardMap::evaluate", ->

      class Class
        state @::, 'abstract',
          A: state
          B: state
          C: state

      object = new Class

      stateA = object.state 'A'
      stateB = object.state 'B'
      stateC = object.state 'C'


Predicates must receive the `againstState` and `asState` arguments passed to
`evaluate`, followed by the `guardType` string of the `GuardMap`.

      it "arguments are passed to the parameters of predicates", ->
        guardMap = new GuardMap 'aGuardType',
          'A': ( against, as, guardType ) ->
            against.name is 'A' and
            as.name is 'B' and
            guardType is 'aGuardType'

        expect( guardMap.evaluate stateA, stateB ).to.equal yes


For a `GuardMap` to `evaluate` to `true`, the `State`s passed as arguments must
satisfy each guard that bears a matching selector key, by satisfying each of
that guard’s predicates.

      it "requires all matching guards to pass", ->
        guardMap = new GuardMap 'aGuardType',
          '***': yes
          'A': [
            ( against, as ) -> yes
            ( against, as, guardType ) -> yes if guardType is 'aGuardType'
            ( against, as ) -> as.name isnt 'C'
          ]
          'B': no

Evaluating against `C` as `B` must pass, because guard `'***'` returns `true`
absolutely, and is the only matching guard for `C`.

        expect( guardMap.evaluate stateC, stateB ).to.equal yes

Evaluating against `B` as `A` must fail, because guard `'B'` returns `false`
absolutely.

        expect( guardMap.evaluate stateB, stateA ).to.equal no

Evaluating against `A` as `B` must pass, because guard `'A'`’s predicates are
all satisfied.

        expect( guardMap.evaluate stateA, stateB ).to.equal yes

Evaluating against `A` as `C` must fail, because guard `'A'`’s last predicate
explicitly requires the `as` argument not to be `C`.

        expect( guardMap.evaluate stateA, stateC ).to.equal no


An empty `GuardMap` must `evaluate` to `true`. For a non-empty `GuardMap`, the
complementary `State` passed as the first argument to `evaluate` must match the
selector of at least one guard; otherwise `evaluate` must return `false`.

      it "requires at least one guard to pass if any are defined", ->

Evaluating an empty map against `B` must pass.

        emptyMap = new GuardMap 'aGuardType', {}
        expect( emptyMap.evaluate stateB, stateC ).to.equal yes

Evaluating a populated map against `B` must fail when the map does not include
any guard with a selector that matches `B`.

        populatedMap = new GuardMap 'aGuardType',
          'A': yes
        expect( populatedMap.evaluate stateB, stateC ).to.equal no
