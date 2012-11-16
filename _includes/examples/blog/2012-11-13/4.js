var q = {
  foo: "FOO", bar: "BAR",
  m: function () { return this.foo; }
};
state( q, {
  A: {
    m: function () {
      return this.superstate().call('m') + this.owner().bar;
    },
    AA: state
  }
});

var p = Object.create( q, {
  baz: { value: "BAZ" }
});
state( p, {
  A: {
    m: function () {
      return this.protostate().call('m') + this.owner().baz;
    }
  }
});

var o = Object.create( p );