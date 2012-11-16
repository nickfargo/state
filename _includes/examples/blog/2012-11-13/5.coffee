class Superclass
  foo: "FOO", bar: "BAR"
  m: -> @foo
  state @::
    A:
      m: -> @superstate().call('m') + @owner().bar
      AA: state

class Class extends Superclass
  baz: "BAZ"
  state @::
    A:
      m: -> @protostate().call('m') + @owner().baz

o = new Class