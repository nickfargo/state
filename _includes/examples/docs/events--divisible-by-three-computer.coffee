class DivisibleByThreeComputer
  constructor: ->
    state this, 'abstract'
      s0: state 'default initial'
          '0':'s0', '1':'s1'
      s1: '0':'s2', '1':'s0'
      s2: '0':'s1', '1':'s2'

  compute: ( number ) ->
    @state '->' # reset
    @state().emit symbol for symbol in number.toString 2
    @state().is 's0'

three = new DivisibleByThreeComputer

three.compute 8          # >>> false
three.compute 78         # >>> true
three.compute 1000       # >>> false
three.compute 504030201  # >>> true