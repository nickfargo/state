class Superclass
  foo: "FOO", bar: "BAR"
  m: -> @foo
  state @::,
    A:
      m: state.bind ->
        @superstate.call('m') + @owner.bar
      AA: state

class Class extends Superclass
  baz: "BAZ"
  state @::,
    A:
      m: state.fix ( autostate, protostate ) -> ->
        protostate.call('m') + @baz

o = new Class
o.m()             # >>> "FOO"
o.state '-> AA'
o.m()             # >>> "FOOBARBAZ"