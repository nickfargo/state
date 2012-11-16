function Superclass () {}
Superclass.prototype.foo = "FOO";
Superclass.prototype.bar = "BAR";
Superclass.prototype.m = function () { this.foo; };
state( Superclass.prototype, {
  A: {
    m: state.method( function () {
      superstate.call('m') + owner.bar;
    }),
    AA: state
  }
});

function Class () {}
Class.prototype.baz = "BAZ";
state( Class.prototype, {
  A: {
    m: state.method( function () {
      protostate.call('m') + owner.baz;
    })
  }
});

var o = new Class;