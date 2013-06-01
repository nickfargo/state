{ O, env, State, RootState } = state = require '../state'
{ expect } = require 'chai'


describe "Events:", ->

  describe "Context and arguments", ->
    { bind, fix } = state

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
              expect( @protostate() ).to.equal Subclass::state 'A'
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


  describe "Each transitional event (`depart`, `exit`, `enter`, `arrive`)", ->

    callback = (e) -> ( transition, args ) ->
      @log "#{ transition.superstate.name }:#{e}"

    addEvents = ( root, callbackFactory = callback ) ->
      for s in [root].concat root.substates yes
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


