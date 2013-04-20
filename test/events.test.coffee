{ O, env, State, RootState } = state = require '../state'
{ expect } = require 'chai'


describe "Events:", ->

  describe "Each transitional event (`depart`, `exit`, `enter`, `arrive`)", ->

    callback = (e) -> -> @owner.log "#{@name}:#{e}"

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
        B:
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


