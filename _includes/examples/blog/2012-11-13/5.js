function Superclass () {}
Superclass.prototype.foo = "FOO";
Superclass.prototype.bar = "BAR";
Superclass.prototype.m = function () { this.foo; };
state( Superclass.prototype, {
  A: {
    m: function () {
      this.superstate().call('m') + this.owner().bar;
    },
    AA: state
  }
});

function Class () {}
Class.prototype.baz = "BAZ";
state( Class.prototype, {
  A: {
    m: function () {
      this.protostate().call('m') + this.owner().baz;
    }
  }
});

var o = new Class;