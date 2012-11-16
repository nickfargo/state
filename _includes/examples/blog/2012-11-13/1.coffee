o =
  foo: "FOO", bar: "BAR"
  m: -> @foo
state o,
  A:
    m: -> @state().superstate().call('m') + @bar

o.m()             # >>> "FOO"
o.state '-> A'
o.m()             # >>> "FOOBAR"