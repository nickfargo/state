    { expect } = require 'chai'
    state = require 'state'

    { NIL } = state.O
    { State, RootState, TransitionExpression } = state
    { ABSTRACT, CONCRETE } = State



    describe "Attributes:", ->

      class Parent
        state @::, 'abstract',
          A: state 'default'
          B: state 'initial'
          C: state 'conclusive',
            CA: state
            CB: state
            CC: state 'final',
              CCA: state 'initial'

      class Child extends Parent
        state @::, 'concrete'


      describe "Abstraction:", ->

        describe "An empty state with no literal or inherited attributes", ->
          state o = {}, null
          s = o.state()

          it "must implicitly bear the `concrete` attribute", ->
            expect( s.isConcrete() ).to.be.true

          it "must implicitly negate the `abstract` attribute", ->
            expect( s.isAbstract() ).to.be.false


        describe "The presence of `abstract`", ->

          it "must negate the `concrete` attribute that a state would otherwise bear via inheritance", ->
            s = Parent::state ''
            expect( s.isAbstract() ).to.be.true
            expect( s.isConcrete() ).to.be.false


        describe "Literal `concrete` on the epistate of an `abstract` protostate", ->

          it "must negate the `abstract` attribute it would otherwise bear", ->
            s = Child::state ''
            expect( s.isConcrete() ).to.be.true
            expect( s.isAbstract() ).to.be.false


        describe "An epistate with no literal attributes", ->

          it "must bear the same abstraction attributes as its protostate", ->
            c = new Child
            s = c.state ''
            expect( s.isConcrete() ).to.be.true
            expect( s.isAbstract() ).to.be.false
            expect( s.attributes & ( ABSTRACT | CONCRETE ) )
              .to.equal s.protostate.attributes & ( ABSTRACT | CONCRETE )


        describe "An invalid production including both literal `abstract` and literal `concrete`", ->
          state p = new Parent, 'abstract concrete', null

          it "must give precedence to `concrete` and negate `abstract`", ->
            s = p.state ''
            expect( s.isConcrete() ).to.be.true
            expect( s.isAbstract() ).to.be.false


        describe "Comparing inheritors of the same prototype that have differing literal abstraction attributes:", ->

          describe "A second-level epistate", ->
            c = new Child

            it "must override the abstraction attributes of its protostate", ->
              expect( c.state() ).to.exist  # ???? not defined

            it "which in turn must override those of the next protostate", ->
              expect( Child::state() ).to.exist  # ???? not defined


          describe "Ordering a transition to the root state:", ->

            describe "A cleanly inheriting instance", ->
              c = new Child

              it "must complete a transition", ->
                expect( -> c.state '->' ).to.not.throw Error

              it "must arrive at its root state", ->
                expect( c.state().name ).to.equal ''


            describe "An overriding instance", ->
              c = new Child
              state c, 'abstract', null

              it "must complete a transition", ->
                expect( -> c.state '->' ).to.not.throw Error

              it "must be redirected to the `default` substate", ->
                root = c.state ''
                s = c.state()
                ds = root.defaultSubstate()
                # console.log "\n\ns =", s, "\n\nds =", ds
                c.state '->'
                expect( s ).to.not.equal root
                expect( s.path() ).to.equal ds.path()


      describe "Destination:", ->

        describe "The `initial` attribute", ->

          it "must be inherited by an instance from its prototype’s tree", ->
            s = ( new Parent ).state()
            expect( s.name ).to.equal 'B'
            expect( s.isInitial() ).to.be.true

          describe "if applied ambiguously to multiple states in a state tree", ->

            it "must resolve in a depth-within-breadth-first manner", ->
              s = Parent::state()
              expect( s.name ).to.equal 'B'
              expect( s.name ).to.not.equal 'CCA'


        describe "The `conclusive` attribute", ->

          it "must be inherited via protostate", ->
            p = new Parent
            expect( p.state('C').isConclusive() ).to.be.true

          it "must cause a state to prohibit transitions that would exit it", ->
            p = new Parent
            p.state '-> C'
            p.state '-> B'
            s = p.state()
            expect( s.name ).to.not.equal 'B'
            expect( s.name ).to.equal 'C'
            expect( s.isConclusive() ).to.be.true

          it "must cause a state to allow transitions that wouldn’t exit it", ->
            p = new Parent
            p.state '-> C'
            p.state '-> CB'
            s = p.state()
            expect( s.name ).to.equal 'CB'


        describe "The `final` attribute", ->

          it "must be inherited via protostate", ->
            p = new Parent
            p.state '-> CC'
            s = p.state()
            expect( s.owner ).to.equal p
            expect( s.name ).to.equal 'CC'
            expect( s.isFinal() ).to.be.true
            expect( s.isVirtual() ).to.be.true

          it "must prohibit transitions that would depart a `final` state", ->
            p = new Parent
            p.state '-> CC'
            p.state '-> CA'
            s = p.state()
            expect( s.name ).to.equal 'CC'
            expect( s.name ).to.not.equal 'CA'
            expect( s.isFinal() ).to.be.true

          it "must not trap transitions that enter but do not arrive", ->
            p = new Parent
            p.state '-> CCA'
            s = p.state()
            expect( s.name ).to.equal 'CCA'
            expect( s.name ).to.not.equal 'CC'
            expect( s.isFinal() ).to.be.false

          it "must allow transitions originating from a substate to exit", ->
            p = new Parent
            p.state '-> CCA'
            p.state '-> CA'
            s = p.state()
            expect( s.name ).to.equal 'CA'
            expect( s.name ).to.not.equal 'CC'
            expect( s.isFinal() ).to.be.false


      describe "Mutability:", ->

        testMutabilityOf = (s) ->
          it "is marked `mutable`", ->
            expect( s.isMutable() ).to.be.true

          it "allows mutation of properties", ->
            s.let 'key', "value"
            expect( s.get 'key' ).to.equal "value"
            s.delete 'key'
            expect( s.get 'key' ).to.be.undefined

          it "allows mutation of methods", ->
            s.addMethod 'm', f = ->
            expect(f).to.equal s.method 'm'
            s.removeMethod 'm'
            expect( s.method 'm' ).to.be.undefined

          it "allows mutation of events", ->
            id = s.on 'exit', f = (transition) ->
            expect(f).to.equal s.event 'exit', id
            s.off 'exit', id
            expect( s.event 'exit', id ).to.be.undefined

          it "allows mutation of guards", ->
            s.addGuard 'admit', ->
            expect( s.guard 'admit' ).to.be.ok
            s.removeGuard 'admit'
            expect( s.guard 'admit' ).to.be.undefined

          it "allows mutation of substates", ->
            s.addSubstate 'A', {}
            expect( s.substate 'A' ).to.be.instanceof State
            s.removeSubstate 'A'
            expect( s.substate 'A' ).to.be.undefined

          it "allows mutation of transitions", ->
            s.addTransition 'T', {}
            expect( s.transition 'T' ).to.be.instanceof TransitionExpression
            s.removeTransition 'T'
            expect( s.transition 'T' ).to.be.undefined

        testFinitudeOf = (s) ->
          it "is marked `finite`", ->
            expect( s.isFinite() ).to.be.true

          it "allows mutation of properties", ->
            s.let 'key', "value"
            expect( s.get 'key' ).to.equal "value"
            s.delete 'key'
            expect( s.get 'key' ).to.be.undefined

          it "allows mutation of methods", ->
            s.addMethod 'm', f = ->
            expect(f).to.equal s.method 'm'
            s.removeMethod 'm'
            expect( s.method 'm' ).to.be.undefined

          it "allows mutation of events", ->
            id = s.on 'exit', f = (transition) ->
            expect(f).to.equal s.event 'exit', id
            s.off 'exit', id
            expect( s.event 'exit', id ).to.be.undefined

          it "allows mutation of guards", ->
            s.addGuard 'admit', ->
            expect( s.guard 'admit' ).to.be.ok
            s.removeGuard 'admit'
            expect( s.guard 'admit' ).to.be.undefined

          it "prohibits mutation of substates", ->
            s.addSubstate 'A', {}
            expect( s.substate 'A' ).to.be.undefined

          it "allows mutation of transitions", ->
            s.addTransition 'T', {}
            expect( s.transition 'T' ).to.be.instanceof TransitionExpression
            s.removeTransition 'T'
            expect( s.transition 'T' ).to.be.undefined

        testImmutabilityOf = ( s, weak ) ->
          unless weak
            it "is marked `immutable`", ->
              expect( s.isImmutable() ).to.be.true

          it "prohibits mutation of properties", ->
            s.let 'key', "value"
            expect( s.get 'key' ).to.be.undefined

          it "prohibits mutation of methods", ->
            s.addMethod 'm', ->
            expect( s.method 'm' ).to.be.undefined

          it "does allow mutation of events", ->
            id = s.on 'exit', f = (transition) ->
            expect(f).to.equal s.event 'exit', id
            s.off 'exit', id
            expect( s.event 'exit', id ).to.be.undefined

          it "prohibits mutation of guards", ->
            s.addGuard 'admit', ->
            expect( s.guard 'admit' ).to.be.undefined

          it "prohibits mutation of substates", ->
            s.addSubstate 'A', {}
            expect( s.substate 'A' ).to.be.undefined

          it "prohibits mutation of transitions", ->
            s.addTransition 'T', {}
            expect( s.transition 'T' ).to.be.undefined


        describe "A state unaffected by mutability attributes", ->

          describe "is weakly immutable, which", ->
            state o = {}, null
            s = o.state ''

            it "does not mark the state as `immutable`", ->
              expect( s.isImmutable() ).to.be.false

            testImmutabilityOf s, weak = yes


        describe "The `mutable` attribute:", ->

          describe "A state that is literal `mutable`", ->
            state o = {}, 'mutable', null
            testMutabilityOf o.state ''

          describe "A state that inherits `mutable` via superstate", ->
            state o = {}, 'mutable', A: state
            testMutabilityOf o.state 'A'

          describe "A state that inherits `mutable` via protostate", ->
            class Class
              state @::, 'mutable', null
            o = new Class
            testMutabilityOf o.state ''

          describe "A state that inherits `mutable` via super- and proto-", ->
            class Class
              state @::, 'mutable', A: state
            o = new Class
            testMutabilityOf o.state 'A'


        describe "The `finite` attribute:", ->

          describe "in superior overruling position relative to `mutable`", ->
            state o = {}, 'finite', A: state 'mutable'
            testFinitudeOf o.state 'A'

          describe "in inferior overruling position relative to `mutable`", ->
            state o = {}, 'mutable', A: state 'finite'
            testFinitudeOf o.state 'A'

          describe "in prototypal overruling position relative to `mutable`", ->
            class Class
              state @::, 'finite'
            state o = new Class, 'mutable'
            testFinitudeOf o.state ''

          describe "in epitypal overruling position relative to `mutable`", ->
            class Class
              state @::, 'mutable'
            state o = new Class, 'finite'
            testFinitudeOf o.state ''


        describe "The `immutable` attribute:", ->

          describe "in superior overruling position relative to `mutable`", ->
            state o = {}, 'immutable', A: state 'mutable'
            testImmutabilityOf o.state 'A'

          describe "in inferior overruling position relative to `mutable`", ->
            state o = {}, 'mutable', A: state 'immutable'
            testImmutabilityOf o.state 'A'

          describe "in prototypal overruling position relative to `mutable`", ->
            class Class
              state @::, 'immutable'
            state o = new Class, 'mutable'
            testImmutabilityOf o.state ''

          describe "in epitypal overruling position relative to `mutable`", ->
            class Class
              state @::, 'mutable'
            state o = new Class, 'immutable'
            testImmutabilityOf o.state ''





