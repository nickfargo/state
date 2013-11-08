    { expect } = require 'chai'
    O          = require 'omicron'
    state      = require 'state'

    { env, NIL } = O
    { State, Region, RootState, TransitionExpression } = state
    { ABSTRACT, CONCRETE } = State

    { TRAVERSAL_FLAGS, REGION_STATES } = state
    { VIA_VIRTUAL } = TRAVERSAL_FLAGS
    { ACTIVE, BACKGROUNDED, SUSPENDED, TERMINATED, FINALIZED } = REGION_STATES


    describe "Concurrency:", ->

      log = -> console.log.apply console, arguments
      print = ( state ) -> log '\n' + state.print()


      describe "Region currency:", ->

        class Class
          state @::,
            A: state
            B: state 'initial concurrent',
              BA: state.region
                BAA: state 'initial'
                BAB: state
              BB: state.region 'abstract volatile',
                BBA: state
                BBB: state 'default'
              BC: state.region 'abstract singular',
                BCA: state 'default'
                BCB: state 'final'
              BD: state.region 'autonomous',
                BDA: state
                BDB: state 'final'
        #print Class::state ''

        it "is maintained independently", ->
          o = new Class
          #print o.state ''
          o.state '-> B'
          #print o.state ''
          expect( o.state() ).to.equal o.state 'B'
          expect( o.state('BA').current() ).to.equal o.state 'BAA'

        it "undergoes transitions independently", ->
          o = new Class
          #print o.state ''

          o.state '-> B'
          #print o.state ''

          o.state 'BA -> BAB'
          o.state 'BB -> BBA'
          #print o.state ''

          expect( o.state('BA').current() ).to.equal o.state 'BAB'
          expect( o.state('BB').current() ).to.equal o.state 'BBA'

        it "is persisted between activations", ->
          o = new Class
          o.state '-> B'
          o.state 'BA -> BAB'
          #print o.state ''
          o.state '-> A'
          #print o.state ''
          o.state '-> B'
          expect( o.state('BA').current() ).to.equal o.state 'BAB'
          #print o.state ''

        it "is not persisted if `volatile`", ->

> Should `VOID` immediately but not `null` the `_current` reference until the
> region recurs (?)

          o = new Class
          #print o.state ''
          o.state '-> B'
          #print o.state ''
          o.state 'BB -> BBA'
          #print o.state ''
          o.state '-> A'
          #print o.state ''
          o.state '-> B'
          expect( o.state('BB').current() ).to.equal o.state 'BBB'
          #print o.state ''

        it "`singular` region enforces intrinsic permanence", ->
          o = new Class
          #print o.state ''

          o.state 'BC -> BCB' # intrinsic: arrives at `final` state
          expect( o.state('BC').current() ).to.equal o.state 'BCB'
          expect( o.state('BC').current().isFinal() ).to.equal yes
          expect( o.state('BC')._state ).to.equal FINALIZED | TERMINATED
          #print o.state ''

          o.state 'BC -> BCA'
          expect( o.state('BC').current() ).to.equal o.state 'BCB'
          #print o.state ''

        it "`singular` region enforces extrinsic permanence", ->
          o = new Class
          #print o.state ''

          o.state '-> A' # extrinsic: concurrency of `B` deactivated
          #print o.state ''

          o.state '-> B'
          expect( o.state('BC').current() ).to.equal o.state 'BCA'
          expect( o.state('BC')._state ).to.equal FINALIZED | TERMINATED
          #print o.state ''

          o.state 'BC -> BCB'
          expect( o.state('BC').current() ).to.equal o.state 'BCA'
          #print o.state ''

        it "`autonomous` region allows backgrounded transitions", ->
          o = new Class
          #print o.state ''

          o.state '-> A'
          expect( o.state('BD')._state ).to.equal ACTIVE | BACKGROUNDED
          #print o.state ''

          o.state 'BD -> BDA'
          expect( o.state('BD').current() ).to.equal o.state 'BDA'
          expect( o.state('BD')._state ).to.equal ACTIVE | BACKGROUNDED
          #print o.state ''

          o.state 'BD -> BDB'
          expect( o.state('BD').current() ).to.equal o.state 'BDB'
          expect( o.state('BD')._state ).to.equal FINALIZED
          #print o.state ''

          o.state '-> B'
          expect( o.state('BD')._state ).to.equal ACTIVE
          #print o.state ''

          o.state 'BD -> BDA'
          expect( o.state('BD')._state ).to.equal ACTIVE
          #print o.state ''

          o.state 'BD ->'
          expect( o.state('BD')._state ).to.equal ACTIVE
          #print o.state ''
