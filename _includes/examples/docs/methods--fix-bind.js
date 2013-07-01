var q = {
  foo: "FOO", bar: "BAR",
  m: function () { return this.foo; }
};
state( q, {
  A: {
    m: state.bind( function () {
      return this.superstate.call('m') + this.owner.bar;
    }),
    AA: state
  }
});

var p = Object.create( q, {
  baz: { value: "BAZ" }
});
state( p, {
  A: {
    m: function () { return this.baz; },
    AA: {
      m: state.fix( function ( autostate, protostate ) {
        return state.bind( function () {
          return protostate.call('m') + this.superstate.call('m');
        });
      })
    }
  }
});

var o = Object.create( p );
o.m();              // >>> "FOO"

o.state('-> AA');
o.m();              // >>> "FOOBARBAZ"