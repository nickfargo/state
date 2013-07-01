{ fix, bind } = state

class Superclass
  foo: "FOO", bar: "BAR"
  m: -> @foo
  state @::,
    A:
      m: bind ->
        @superstate.call('m') + @owner.bar
      AA: state

class Class extends Superclass
  baz: "BAZ"
  state @::,
    A:
      m: -> @baz
      AA:
        m: fix ( autostate, protostate ) -> bind ->
          protostate.call('m') + @superstate.call('m')

o = new Class
o.m()             # >>> "FOO"
o.state '-> AA'
o.m()             # >>> "FOOBARBAZ"