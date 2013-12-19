    { expect } = require 'chai'
    state = require 'state'

    { TRAVERSAL_FLAGS } = state

    { VIA_NONE, VIA_SUB, VIA_SUPER, VIA_PROTO, VIA_VIRTUAL, VIA_ALL } =
      TRAVERSAL_FLAGS



    describe "State::query", ->

      class Superclass
        state @::, 'abstract',
          A: state 'default initial'
          B: state

      class Class extends Superclass
        state @::,
          A: state
            AA: state
            AB: state

      it "queries virtual states", ->
        o = new Class
        expect( o.state('A').owner ).to.equal o
        expect( o.state('A') ).to.equal o.state()
        expect( o.state().isVirtual() ).to.equal yes

      it "matches virtual states", ->
        o = new Class
        root = o.state().root
        expect( root.query 'A', o.state() ).to.equal yes
        o.state '-> AA'
        expect( root.query 'AA', o.state() ).to.equal yes

      it "queries and matches against prototypal states", ->
        o = new Class
        A = o.state()
        expect( A.query 'AB' ).to.equal Class::state 'AB'
        expect( A.query 'B' ).to.equal Superclass::state 'B'
        expect( A.query 'AB', Class::state 'AB' ).to.equal yes
        expect( A.query 'B', Superclass::state 'B' ).to.equal yes

      it "recognizes virtual states in inclusion test", ->
        o = new Class
        root = o.state().root
        expect( root.query '*', o.state() ).to.equal yes
        o.state '-> AA'
        expect( root.query '*', o.state() ).to.equal no
        expect( root.query '**', o.state() ).to.equal yes

      it "resolves the absolute single wildcard selector", ->
        o = new Class
        list = ( path for path of Superclass::state '*' ).join ' '
        expect( list ).to.equal "A B"
        list = ( path for path of Class::state '*' ).join ' '
        expect( list ).to.equal "A"
        set = ( path for path of o.state '*' )
        list = set.join ' '
        expect( set ).to.have.length 0
        expect( list ).to.equal ""

      it "resolves the absolute double wildcard selector", ->
        o = new Class
        list = ( path for path of Superclass::state '**' ).join ' '
        expect( list ).to.equal "A B"
        list = ( path for path of Class::state '**' ).join ' '
        expect( list ).to.equal "A A.AA A.AB"
        set = ( path for path of o.state '**' )
        list = set.join ' '
        expect( set ).to.have.length 0
        expect( list ).to.equal ""

      it "resolves the absolute triple wildcard selector", ->
        o = new Class
        list = ( path for path of Superclass::state '***' ).join ' '
        expect( list ).to.equal " A B"
        list = ( path for path of Class::state '***' ).join ' '
        expect( list ).to.equal " A A.AA A.AB"
        set = ( path for path of o.state '***' )
        list = set.join ' '
        expect( set ).to.have.length 1
        expect( list ).to.equal ""
