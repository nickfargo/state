var q = {
  foo: "FOO", bar: "BAR",
  m: function () { return this.foo; }
};
state( q, {
  A: {
    m: state.method( function () {
      return superstate.call('m') + owner.bar;
    }),
    AA: state
  }
});

var p = Object.create( q, {
  baz: { value: "BAZ" }
});
state( p, {
  A: {
    m: state.method( function () {
      return protostate.call('m') + owner.baz;
    })
  }
});

var o = Object.create( p );