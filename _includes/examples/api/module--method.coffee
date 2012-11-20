class Superclass
  state @::,
    A:
      inherited: ->
        { autostate, protostate, superstate, owner }

class Class
  question = null
  answer = 42

  # Don’t call this ...
  plain = ( param ) ->                                        # [1]
    return { question, answer, param, autostate, protostate,
      this:this, superstate, owner }

  state @::,
    A:
      # ... call this
      lexical: state.method({ question, answer }) plain       # [2]

      inherited: state.method
        q: question, a: answer
        ( param ) ->
          ok = yes

          stuff = autostate.apply 'lexical', arguments
          ok and =
            stuff.question is q and
            stuff.answer is a and
            stuff.param is param

          stuff = protostate.apply 'inherited', arguments
          ok and =
            stuff.autostate is protostate and
            stuff.protostate is undefined and
            stuff.superstate is superstate.protostate() and
            stuff.owner is Object.getPrototypeOf owner

o = new Class
o.state '-> A'

o.lexical "foo"
# >>> { question: null,
#       answer: 42,
#       param: "foo",
#       autostate: [State]      <- 'A' of `Class.prototype`
#       protostate: [State]     <- 'A' of `Class.prototype`
#       this: [State],          <- 'A' of `o`
#       superstate: [State],    <- root state of `o`
#       owner: [Class]          <- `Class.prototype`
#     }

o.inherited "bar"
# >>> true