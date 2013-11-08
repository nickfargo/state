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
          #print o.state ''
          expect( o.state('BA').current() ).to.equal o.state 'BAB'

        it "is not persisted if volatile", ->
          o = new Class
          #print o.state ''
          o.state '-> B'
          #print o.state ''
          o.state 'BB -> BBA'
          #print o.state ''
          o.state '-> A'
          #print o.state ''
          o.state '-> B'
          #print o.state ''
          expect( o.state('BB').current() ).to.equal o.state 'BBB'

        it "enforces intrinsic permanence", ->
          o = new Class
          #print o.state ''
          o.state 'BC -> BCB' # intrinsic: arrives at `final` state
          #print o.state ''
          expect( o.state('BC').current() ).to.equal o.state 'BCB'
          expect( o.state('BC').current().isFinal() ).to.equal yes
          expect( o.state('BC')._state & FINALIZED ).to.be.ok
          expect( o.state('BC')._state & TERMINATED ).to.be.ok
          o.state 'BC -> BCA'
          #print o.state ''
          expect( o.state('BC').current() ).to.equal o.state 'BCB'

        it "enforces extrinsic permanence", ->
          o = new Class
          #print o.state ''
          o.state '-> A' # extrinsic: concurrency of `B` deactivated
          #print o.state ''
          o.state '-> B'
          #print o.state ''
          expect( o.state('BC').current() ).to.equal o.state 'BCA'
          expect( o.state('BC')._state & FINALIZED ).to.be.ok
          expect( o.state('BC')._state & TERMINATED ).to.be.ok
          o.state 'BC -> BCB'
          #print o.state ''
          expect( o.state('BC').current() ).to.equal o.state 'BCA'

        it "allows backgrounded autonomous transitions", ->
          o = new Class
          print o.state ''
          o.state '-> A'
          print o.state ''
          o.state 'BD -> BDA'
          print o.state ''
          o.state 'BD -> BDB'
          print o.state ''
          o.state '-> B'
          print o.state ''
          o.state 'BD -> BDA'
          print o.state ''
          o.state 'BD ->'
          print o.state ''
