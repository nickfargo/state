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

var p = Object.create( q );
p.baz = "BAZ";
state( p, {
  A: {
    m: state.fix( function ( autostate, protostate ) {
      return function () {
        return protostate.call('m') + this.baz;
      };
    })
  }
});

var o = Object.create( p );
o.m();              // >>> "FOO"

o.state('-> AA');
o.m();              // >>> "FOOBARBAZ"