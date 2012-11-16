var o = {
  foo: "FOO", bar: "BAR",
  m: function () { return this.foo; }
};
state( o, {
  A: {
    m: function () {
      return this.state().superstate().call('m') + this.bar;
    }
  }
});

o.m();              // >>> "FOO"
o.state('-> A');  
o.m();              // >>> "FOOBAR"