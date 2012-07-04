module "state/data"

test "State.data", ->
  NIL = Z.NIL

  class Class
    constructor: ->
      state this, 'mutable reflective',
        data:
          a: 1
          b: "2"
          c: [ 3, "4", 5:"foo" ]
          d: {}
          e:
            f: 6
            g: "7"
            h: [ 8, 9 ]
        State1:
          data:
            b: 2
            c: [ undefined, undefined, 5:"bar" ]
        State2:
          data: {}

    state @::,
      mutate: ( mutation, delta ) -> ok true, "mutate event"

  o = new Class

  ok o.state().data(),
    "Data accessible from `data()`"

  strictEqual o.state('').data().a,
    o.state('State1').data().a,
    "Substate data inherits primitive-typed data member from superstate"

  strictEqual o.state('').data().b,
    o.state('State1').data().b,
    "Substate data overrides primitive-typed data member of superstate"

  strictEqual o.state('State1').data().c[1],
    "4",
    "Substate data inherits data member from superstate through own sparse array"

  o.state('').data
    a: NIL
    d: a: 1
    e:
      g: NIL
      h: [ undefined, "nine" ]

  deepEqual o.state('').data(),
    {
      b: "2"
      c: [ 3, "4", 5:"foo" ]
      d: a: 1
      e: f: 6, h: [ 8, "nine" ]
    },
    ""

  deepEqual o.state('State1').data(),
    {
      b: 2
      c: [ 3, "4", 5: "bar" ]
      d: a: 1
      e: f: 6, h: [ 8, "nine" ]
    },
    ""

  expect 7
