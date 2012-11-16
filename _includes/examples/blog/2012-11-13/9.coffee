class Superclass
  foo: "FOO", bar: "BAR"
  m: -> @foo
  state @::
    A:
      m: state.method -> superstate.call('m') + owner.bar
      AA: state

class Class extends Superclass
  baz: "BAZ"
  state @::
    A:
      m: state.method -> protostate.call('m') + owner.baz

o = new Class