var o = {
  foo: "FOO", bar: "BAR",
  m: function () { return this.foo; }
};
state( o, {
  A: {
    m: function () {
      return this.superstate().call('m') + this.owner().bar;
    },
    AA: state
  }
});

o.m();              // >>> "FOO"
o.state('-> A');  
o.m();              // >>> "FOOBAR"
o.state('-> AA');  
o.m();              // >>> "FOOBAR"