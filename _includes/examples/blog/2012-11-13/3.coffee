o =
  foo: "FOO", bar: "BAR"
  m: -> @foo
state o,
  A:
    m: -> @superstate().call('m') + @owner().bar
    AA: state

o.m()             # >>> "FOO"
o.state '-> A'
o.m()             # >>> "FOOBAR"
o.state '-> AA'
o.m()             # >>> "FOOBAR"