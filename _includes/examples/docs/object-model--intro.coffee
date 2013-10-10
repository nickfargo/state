class Class
  state p = @::,
    A: state
    B: state
      BA: state
      BB: state

state o = new Class,
  A: state
    AA: state.extend 'X, Y'
  X: state
  Y: state
