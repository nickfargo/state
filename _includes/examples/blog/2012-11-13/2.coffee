state o,
  A:
    m: -> @state().superstate().call('m') + @bar
    AA: state

o.state '-> AA'
o.m()             # >>> RangeError: Maximum call stack size exceeded