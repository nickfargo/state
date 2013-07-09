class Class
  state @::, A: state

p = Class::
o = new Class
o.state('A').on 'enter', ->         # [1]
state.fix( o, 'A' ).on 'enter', ->  # [2]
