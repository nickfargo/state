{ env, State, RootState } = state = require '../state'
{ expect } = require 'chai'


describe "Methods:", ->
  pm = p_m = p_Am = p_AAm =
  cm = c_Am = c_Az =
  null

  class Parent
    m: pm = -> 'Pm0'
    state @::,
      m: p_m = -> 'Pm1'
      A:
        m: p_Am = -> 'Pm2'
        AA:
          m: p_AAm = -> 'Pm3'

  class Child
    m: cm = -> 'Cm0'
    state @::,
      A:
        m: c_Am = -> 'Cm2'
        z: c_Az = -> 'Cz2'

  setup = ->
    o = new Child
    o.f = f = -> 'of0'
    o.m = m = -> 'om0'
    {o,f,m}


  describe "Own accessor", ->

    it "is created upon first invocation of inherited accessor", ->
      {o,f,m} = setup()
      expect( o ).to.not.have.ownProperty 'state'
      o.state()
      expect( o ).to.have.ownProperty 'state'


  describe "Dispatchers:", ->

    it "creates dispatcher", ->
      expect( Child::m ).to.have.property 'isDispatcher'
      expect( Child::m.isDispatcher ).to.be.ok

    it "saves original owner method using expando `original` on dispatcher", ->
      expect( Child::m ).to.have.property 'original'
      expect( Child::m.original ).to.equal cm

    it "out-of-state methods are callable, void-typed, heritable via protostate, and have the side-effect of creating an own accessor", ->
      {o,f,m} = setup()
      expect( o ).to.not.have.ownProperty 'state'
      expect( o.z() ).to.be.undefined
      expect( o ).to.have.ownProperty 'state'

    it "creates dispatchers for an inheritor upon first invocation of its accessor", ->
      {o,f,m} = setup()
      o.state()
      expect( m ).to.not.equal o.m
      expect( o.m ).to.have.property 'isDispatcher'

    it "swizzles owner methods to the root state if there exists a stateful implementation of the method", ->
      {o,f,m} = setup()
      o.state()
      expect( m ).to.equal o.state('').method 'm'
      expect( o.m() ).to.equal 'om0'

    it "ignores owner methods for which no stateful implementation exists", ->
      {o,f,m} = setup()
      o.state()
      expect( f ).to.equal o.f


  # This will fail; `unless this is root` in `State::addMethod` prevents
  # expando `original`
  0 and
  describe "Destroying an object’s entire state tree", ->

    it "must revert an object to its “nascent” condition; any methods previously subsumed into the root state must be returned to their original location on the object", ->
      {o,f,m} = setup()
      env.debug = yes
      o.state()
      env.debug = no

      expect( f ).to.equal o.f
      expect( m ).to.not.equal o.m

      do o.state('').destroy

      expect( f ).to.equal o.f
      expect( m ).to.equal o.m
