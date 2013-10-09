state o = {},
  A: state
    AA: state
    AB: state
  B: state


root = o.state ''                        # >>> RootState
o.state() is root                        # >>> true
o.state '-> AA'
o.state() is o.state 'AA'                # >>> true
o.state().superstate is o.state 'A'      # >>> true
o.state().superstate.superstate is root  # >>> true
