class Superclass
  state @::,
    A: state
      data: { a: 'a' }
    X: state 'abstract',
      data: { x: 24 }

class Class extends Superclass
  state @::,
    A: state
      AA: state.extend 'X',
        data: { aa: 'aa' }
    Y: state 'abstract',
      data: { y: 25 }

o = new Class
state o,
  B: state.extend 'X, Y',
    data: { b: 'b' }


o.state '-> AA'
o.data()         # >>> { aa: 'aa', x: 24, a: 'a' }
o.state '-> B'
o.data()         # >>> { b: 'b', x: 24, y: 25 }
