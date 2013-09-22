    state = require '../..'
    { expect } = require 'chai'



    describe "Linearization:", ->

      reducer = ( out, s ) ->
        if out then out += ' '
        out += s.name or '<ROOT>'

      orderOf = ( s ) -> s.linearize().reduce reducer, ''


      expressions =

        'long diamond': state               #      <ROOT>
          A: state                          #       / \
          B: state                          #      A   B
          C: state.extend 'A'               #      |   |
          D: state.extend 'B'               #      C   D
          E: state.extend 'C, D'            #       \ /
                                            #        E

        'folded triple diamond': state      #      <ROOT>
          A: state                          #     /   | \
          B: state                          #    A_   B  C
          C: state                          #     \`–/  /
          D: state.extend 'A, B'            #      D `–E
          E: state.extend 'A, C'            #       \ /
          F: state.extend 'D, E'            #        F

        'tesselated triple diamond': state  #      <ROOT>
          A: state                          #     /  |  \
          B: state                          #    B   A   C
          C: state                          #     \ / \ /
          D: state.extend 'B, A'            #      D   E
          E: state.extend 'A, C'            #       \ /
          F: state.extend 'D, E'            #        F

A state’s parastates precede its superstate in the resolution order. Defining
states with both hierarchy via superstates and “mixins” via parastates should
yield the same linearization as the expression above.

        'hierarchical TTD': state           #      <ROOT>
          A: state                          #     /  |  \
            D: state.extend 'B'             #    B   A   C
          B: state                          #     \ / \ /
          C: state                          #      D   E
            E: state.extend 'A',            #       \ /
              F: state.extend 'D'           #        F


      it "computes the monotonic order of parastates and superstates", ->
        state o = {}, expressions['long diamond']

        expect( orderOf o.state '' ).to.equal '<ROOT>'
        expect( orderOf o.state 'A' ).to.equal 'A <ROOT>'
        expect( orderOf o.state 'B' ).to.equal 'B <ROOT>'
        expect( orderOf o.state 'C' ).to.equal 'C A <ROOT>'
        expect( orderOf o.state 'D' ).to.equal 'D B <ROOT>'
        expect( orderOf o.state 'E' ).to.equal 'E C A D B <ROOT>'


      it "computes monotonic order equivalently via protostates", ->
        class Class
          state @::, expressions['long diamond']

        o = new Class

        expect( orderOf o.state '' ).to.equal '<ROOT>'
        expect( orderOf o.state 'A' ).to.equal 'A <ROOT>'
        expect( orderOf o.state 'B' ).to.equal 'B <ROOT>'
        expect( orderOf o.state 'C' ).to.equal 'C A <ROOT>'
        expect( orderOf o.state 'D' ).to.equal 'D B <ROOT>'
        expect( orderOf o.state 'E' ).to.equal 'E C A D B <ROOT>'


      it "computes order via protostates, parastates, and superstates", ->
        class Class
          state @::, expressions['hierarchical TTD']

        o = new Class
        state o, C: E: G: state.extend 'D'
        expect( orderOf o.state 'G' ).to.equal 'G D B E A C <ROOT>'

        o = new Class
        state o, C: E: G: H: state.extend 'D'
        expect( orderOf o.state 'H' ).to.equal 'H D B G E A C <ROOT>'


      it "resolves the folded-triple-diamond formation", ->
        state o = {}, expressions['folded triple diamond']
        expect( orderOf o.state 'F' ).to.equal 'F D E A B C <ROOT>'


      it "resolves the tesselated-triple-diamond formation", ->
        state o = {}, expressions['tesselated triple diamond']
        expect( orderOf o.state 'F' ).to.equal 'F D B E A C <ROOT>'


      it "preserves monotonicity with parastates-precede-superstate rule", ->
        state o = {}, expressions['hierarchical TTD']
        expect( orderOf o.state 'F' ).to.equal 'F D B E A C <ROOT>'
