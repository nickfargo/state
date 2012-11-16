q =
  foo: "FOO", bar: "BAR"
  m: -> @foo
state q,
  A:
    m: -> @superstate().call('m') + @owner().bar
    AA: state

p = Object.create q,
  baz: value: "BAZ"
state p,
  A:
    m: -> @protostate().call('m') + @owner().baz

o = Object.create p