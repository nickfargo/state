    state = require '../..'
    { expect } = require 'chai'



    describe "linearization:", ->

      reducer = ( out, s ) ->
        if out then out += ' '
        out += s.name or '<ROOT>'

      orderOf = ( s ) -> s.linearize().reduce reducer, ''


      expressions =

        longDiamond: state              #    <ROOT>
          A: state                      #     / \
          B: state                      #    A   B
          C: state extends: 'A'         #    |   |
          D: state extends: 'B'         #    C   D
          E: state extends: 'C, D'      #     \ /
                                        #      E

        foldedTripleDiamond: state      #      <ROOT>
          A: state                      #     /   |  \
          B: state                      #    A_   B  C
          C: state                      #     \`–/  /
          D: state extends: 'A, B'      #      D `–E
          E: state extends: 'A, C'      #       \ /
          F: state extends: 'D, E'      #        F

        tesselatedTripleDiamond: state  #      <ROOT>
          A: state                      #     /  |  \
          B: state                      #    B   A   C
          C: state                      #     \ / \ /
          D: state extends: 'B, A'      #      D   E
          E: state extends: 'A, C'      #       \ /
          F: state extends: 'D, E'      #        F

A state’s parastates precede its superstate in the resolution order. Defining
states with both hierarchy via superstates and “mixins” via parastates should
yield the same linearization as the expression above.

        paraSuperStateMixOfTTD: state   #      <ROOT>
          A: state                      #     /  |  \
            D: state extends: 'B'       #    B   A   C
          B: state                      #     \ / \ /
          C: state                      #      D   E
            E: state                    #       \ /
              extends: 'A'              #        F
              F: state extends: 'D'


      it "computes the monotonic order of parastates and superstates", ->
        state o = {}, expressions.longDiamond

        expect( orderOf o.state '' ).to.equal '<ROOT>'
        expect( orderOf o.state 'A' ).to.equal 'A <ROOT>'
        expect( orderOf o.state 'B' ).to.equal 'B <ROOT>'
        expect( orderOf o.state 'C' ).to.equal 'C A <ROOT>'
        expect( orderOf o.state 'D' ).to.equal 'D B <ROOT>'
        expect( orderOf o.state 'E' ).to.equal 'E C A D B <ROOT>'


      it "computes monotonic order equivalently from protostates", ->
        class Class
          state @::, expressions.longDiamond

        o = new Class

        expect( orderOf o.state '' ).to.equal '<ROOT>'
        expect( orderOf o.state 'A' ).to.equal 'A <ROOT>'
        expect( orderOf o.state 'B' ).to.equal 'B <ROOT>'
        expect( orderOf o.state 'C' ).to.equal 'C A <ROOT>'
        expect( orderOf o.state 'D' ).to.equal 'D B <ROOT>'
        expect( orderOf o.state 'E' ).to.equal 'E C A D B <ROOT>'


      it "resolves the folded-triple-diamond formation", ->
        state o = {}, expressions.foldedTripleDiamond
        expect( orderOf o.state 'F' ).to.equal 'F D E A B C <ROOT>'


      it "resolves the tesselated-triple-diamond formation", ->
        state o = {}, expressions.tesselatedTripleDiamond
        expect( orderOf o.state 'F' ).to.equal 'F D B E A C <ROOT>'


      it "preserves monotonicity with parastates-precede-superstate rule", ->
        state o = {}, expressions.paraSuperStateMixOfTTD
        expect( orderOf o.state 'F' ).to.equal 'F D B E A C <ROOT>'
