    { expect } = require 'chai'
    state = require 'state'

    { O, env, State, RootState, bind } = state



    describe "Events:", ->

      describe "Context and arguments", ->
        { bind, fix } = state

        it "converts raw arguments to an array", ->
          state o = {},
            A: state
              enter: ( transition, args ) ->
                expect( args.join ' ' ).to.equal "one two three"

          do ( a = 'one', b = 'two', c = 'three' ) -> o.state '-> A', arguments


        do ->
          state o = {},
            A: state
              enter: ( transition, args ) ->
                currentState = @state()

                it "binds context to the owner", =>
                  expect( this ).to.equal o

                it "provides correct arguments to transition and args params", ->
                  expect( transition ).to.equal currentState
                  expect( args.join ' ' ).to.equal "one two three"

              exit: bind ( transition, args ) ->
                currentState = @current()

                it "binds context to the local state", =>
                  expect( this ).to.equal o.state 'A'

                it "provides correct arguments to transition and args params", ->
                  expect( transition ).to.equal currentState
                  expect( args.join ' ' ).to.equal "one two three"

          describe "with a normal function", ->
            o.state '-> A', ['one', 'two', 'three']

          describe "with a state-bound function", ->
            o.state '->', ['one', 'two', 'three']


        do ->
          class Class
            state @::,
              A: state

          class Subclass extends Class
            state @::,
              A: state
                enter: fix ( autostate, protostate ) -> ( transition, args ) ->
                  currentState = @state()

                  it "binds context for a state-fixed function to the instance", =>
                    expect( this ).to.equal instance

                  it "closes over the proper autostate and protostate", ->
                    expect( autostate ).to.equal Subclass::state 'A'
                    expect( protostate ).to.equal Class::state 'A'

                  it "provides correct arguments to transition and args params", ->
                    expect( transition ).to.equal currentState
                    expect( args.join ' ' ).to.equal "one two three"

                exit: fix ( autostate, protostate ) -> bind ( transition, args ) ->
                  currentState = @current()

                  it "binds context for a fixed-bound function to the state", =>
                    expect( @isVirtual() ).to.be.ok
                    expect( @protostate ).to.equal Subclass::state 'A'

                  it "closes over the proper autostate and protostate", ->
                    expect( autostate ).to.equal Subclass::state 'A'
                    expect( protostate ).to.equal Class::state 'A'

                  it "provides correct arguments to transition and args params", ->
                    expect( transition ).to.equal currentState
                    expect( args.join ' ' ).to.equal "one two three"

          instance = new Subclass

          describe "with a state-fixed function", ->
            instance.state '-> A', ['one', 'two', 'three']

          describe "with a fixed and bound function", ->
            instance.state '->', ['one', 'two', 'three']

      describe "Delegation:", ->

        recordEvent = ->
          @owner.eventRecords.push @name

        recordEventWithPrefix = ( prefix = '' ) -> ->
          @owner.eventRecords.push prefix + @name


        it "emits events on behalf of a substate", ->
          o = eventRecords: []
          state o,
            A: state 'initial'
            B: state

          o.state('').on 'enter', bind recordEvent
          o.state('').on ':enter', bind recordEvent
          o.state('').on 'B:enter', bind recordEvent
          o.state('A').on '..B:enter', bind recordEvent # impossible

          o.state '-> B'
          expect( o.eventRecords ).to.have.length 1
          expect( o.eventRecords[0] ).to.equal 'B'

        it "can be expressed as a structured `StateExpression`", ->
          o = eventRecords: []
          state o,
            A: state 'initial'
            B: state
            events:
              enter: bind recordEvent
              ':enter': bind recordEvent
              'B:enter': bind recordEvent

          o.state '-> B'
          expect( o.eventRecords ).to.have.length 1
          expect( o.eventRecords[0] ).to.equal 'B'

        it "can be expressed as a shorthand `StateExpression`", ->
          o = eventRecords: []
          state o,
            A: state 'initial'
            B: state
            enter: bind recordEvent
            ':enter': bind recordEvent
            'B:enter': bind recordEvent

          o.state '-> B'
          expect( o.eventRecords ).to.have.length 1
          expect( o.eventRecords[0] ).to.equal 'B'

        it "traverses the protostate–epistate relation", ->
          class Superclass
            constructor: ->
              @eventRecords = []

            state @::,
              A: state 'initial'
              B: state
              enter: bind recordEvent
              ':enter': bind recordEvent
              'B:enter': bind recordEvent

          class Class extends Superclass

          o = new Class
          o.state '-> B'
          expect( o.eventRecords ).to.have.length 1
          expect( o.eventRecords[0] ).to.equal 'B'

        it "emits events on behalf of arbitrary substates", ->
          class Superclass
            constructor: ->
              @eventRecords = []

            state @::,
              A: state 'initial'
              B: state
              '*:enter': bind recordEvent

          class Class extends Superclass

          o = new Class
          o.state '-> B'
          o.state '-> A'
          o.state '-> B'
          expect( o.eventRecords.join ' ' ).to.equal "B A B"

        it "emits events on behalf of arbitrary substate descendants", ->
          class Superclass
            constructor: ->
              @eventRecords = []

            state @::,
              A: state 'initial',
                AA: state
              B: state
                BA: state
                BB: state
                  BBA: state
              '**:enter': bind recordEvent

          class Class extends Superclass
            state @::,
              'B.***:enter': bind recordEventWithPrefix '^'
              C: state

          o = new Class
          o.state '-> AA'
          o.state '-> BA'
          o.state '-> BBA'
          o.state '-> C'
          expect( o.eventRecords.join ' ' ).to.equal """
            AA
            ^B B ^BA BA
            ^BB BB ^BBA BBA
            C
          """.split('\n').join(' ')

        it "emits delegated events inherited via parastate and superstate", ->
          class Superclass
            constructor: ->
              @eventRecords = []

            state @::, 'abstract',
              A: state 'abstract',
                '*:enter': bind recordEventWithPrefix '(A)'
              B: state 'abstract',
                '**:enter': bind recordEventWithPrefix '(B)'

          class Class extends Superclass
            state @::,
              '**:enter': bind recordEvent

              C: state.extend 'A, B', 'default',
                CA: state
                  CAA: state
                  CAB: state
                CB: state
              D: state.extend 'B, A'

          o = new Class
          o.state '-> CAA'
          o.state '-> D'
          o.state '-> CAB'
          expect( o.eventRecords.join ' ' ).to.equal """
            (B)CA CA (B)CAA CAA
            (B)D (A)D D
            (A)C (B)C C (B)CA CA (B)CAB CAB
          """.split('\n').join(' ')



      describe "Each transitional event (`depart`, `exit`, `enter`, `arrive`)", ->

        callback = (e) -> ( transition, args ) ->
          @log "#{ transition.superstate.name }:#{e}"

        addEvents = ( root, callbackFactory = callback ) ->
          for name, s of root.descendants null, { '': root }
            for e in ['depart', 'exit', 'enter', 'arrive']
              s.on e, callbackFactory e

        log = (value) ->
          @store.push value
          value

        unit =
          expression: state
            A: state 'initial'
            B: state
              BA: state
              BB: state

          traverse: (o) ->
            o.state '->'
            o.state '-> B'
            o.state '-> BA'
            o.state '-> BB'

          expectation: """
            A:depart
            A:exit
            :arrive
            :depart
            B:enter
            B:arrive
            B:depart
            BA:enter
            BA:arrive
            BA:depart
            BA:exit
            BB:enter
            BB:arrive
          """


        it "is emitted properly from an object’s own state tree", ->
          o = { store: [], log }
          state o, unit.expression
          addEvents o.state ''
          unit.traverse o
          expect( o.store.join '\n' ).to.equal unit.expectation


        it "is emitted properly via prototype", ->
          class Class
            constructor: -> @store = []
            log: log
            state @::, unit.expression
            addEvents @::state ''

          state o = new Class
          unit.traverse o
          expect( o.store.join '\n' ).to.equal unit.expectation


      describe "Each existential event (`construct`, `destroy`)", ->


      describe "The `mutate` event", ->


