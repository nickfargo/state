    { expect } = require 'chai'
    state = require 'state'

    { TRAVERSAL_FLAGS } = state

    { VIA_NONE, VIA_SUB, VIA_SUPER, VIA_PROTO, VIA_VIRTUAL, VIA_ALL } =
      TRAVERSAL_FLAGS



    describe "State::substates", ->

      class Superclass
        state @::, 'abstract',
          A: state 'default initial'
          B: state
            BA: state
              BAA: state
              BAB: state
            BB: state
          C: state

      class Class extends Superclass
        state @::,
          A: state
            AA: state 'initial'
            AB: state

      it "returns an empty set when called with no args", ->
        o = new Class
        set = o.state('').substates()
        expect( set ).to.be.empty

      it "includes all descendants", ->
        set = Superclass::state('').substates VIA_SUB
        list = "A B B.BA B.BA.BAA B.BA.BAB B.BB C".split ' '
        expect( path for path of set ).to.have.length list.length
        expect( set[ path ] ).to.exist for path in list

      it "includes all descendants inherited via protostate", ->
        set = Class::state('').substates VIA_SUB | VIA_PROTO
        list = "A A.AA A.AB B B.BA B.BA.BAA B.BA.BAB B.BB C".split ' '
        expect( path for path of set ).to.have.length list.length
        expect( set[ path ] ).to.exist for path in list

      it "includes virtual states", ->
        o = new Class
        set = o.state('').substates VIA_VIRTUAL | VIA_SUB
        list = "A A.AA".split ' '
        expect( path for path of set ).to.have.length list.length
        expect( set[ path ] ).to.exist for path in list

      it "returns virtual states and all descendants of protostates", ->
        o = new Class
        set = o.state('').substates VIA_ALL
        list = "A A.AA A.AB B B.BA B.BA.BAA B.BA.BAB B.BB C".split ' '
        expect( path for path of set ).to.have.length list.length
        expect( set[ path ] ).to.exist for path in list
        expect( set['A'].isVirtual() ).to.equal yes
        expect( set['A.AA'].isVirtual() ).to.equal yes
        expect( set['A.AB'].isVirtual() ).to.equal no

      it "does not specify order", -> ;
