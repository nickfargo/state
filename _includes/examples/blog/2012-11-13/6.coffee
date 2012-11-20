{ closed, Class, o } = do ( closed = {} ) ->

  class Class
    state @::, 'abstract'
      A: state 'default'
        normal: -> { closed }

        bound: state.method
          c: closed
          ->
            { c, autostate, protostate, this:this }

  o = new Class
  state o,
    A:
      normal: ( param ) ->
        { param, closed }
      
      alsoBound: state.method({ closed }) ( param ) ->
        { param, closed, autostate, protostate, this:this }

  { closed, Class, o }


stuff = o.bound()
stuff.closed is closed                # >>> true
stuff.autostate is Class::state 'A'   # >>> true
stuff.protostate is null              # >>> true

stuff = o.alsoBound "argument"
stuff.param is "argument"             # >>> true
stuff.closed is closed                # >>> true
stuff.autostate is o.state 'A'        # >>> true
stuff.protostate is Class::state 'A'  # >>> true