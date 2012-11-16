state( o, {
  A: {
    m: function () {
      return this.state().superstate().call('m') + this.bar;
    },
    AA: state
  }
});

o.state('-> AA');
o.m();              // >>> RangeError: Maximum call stack size exceeded