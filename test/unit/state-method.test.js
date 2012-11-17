( function ( $, assert, undefined ) {

module( "state.method" );

var Superclass = ( function () {
  function Superclass () {}

  O.assign( Superclass.prototype, {
    foo: "FOO", bar: "BAR",
    m: function () { return this.foo; }
  });
  
  state( Superclass.prototype, {
    autostate: state.method( function () { return autostate; } ),
    protostate: state.method( function () { return protostate; } ),

    A: {
      autostate: state.method( function () { return autostate; } ),
      protostate: state.method( function () { return protostate; } ),

      m: state.method( function () {
        return superstate.call('m') + owner.bar;
      }),
      AA: state
    }
  });

  return Superclass;
}() );

var Class = ( function () {
  O.inherit( Class, Superclass );
  function Class () {}

  O.assign( Class.prototype, {
    baz: "BAZ"
  });

  state( Class.prototype, {
    autostate: state.method( function () { return autostate; } ),
    protostate: state.method( function () { return protostate; } ),

    A: {
      autostate: state.method( function () { return autostate; } ),
      protostate: state.method( function () { return protostate; } ),

      m: state.method( function () {
        return protostate.call('m') + owner.baz;
      })
    }
  });

  return Class;
}() );


/////////////////////

test( "method", function () {
  var o = new Class;

  assert.ok( o.autostate() === Class.prototype.autostate() );
  assert.ok( o.autostate().protostate() === Superclass.prototype.autostate() );
  assert.ok( o.protostate() === Class.prototype.protostate() );
  assert.ok( o.protostate().protostate() === Superclass.prototype.protostate() );
  assert.ok( o.protostate().protostate() === undefined );

  assert.ok( o.m() === "FOO" );
  
  
  o.state('-> A');

  assert.ok(
    o.autostate() !==
    Class.prototype.autostate()
  );
  assert.ok(
    o.autostate() ===
    Class.prototype.state('A').call('autostate')
  );
  assert.ok(
    o.autostate().protostate() ===
    Superclass.prototype.state('A').call('autostate')
  );
  assert.ok(
    o.protostate() ===
    Class.prototype.state('A').call('protostate')
  );
  assert.ok(
    o.protostate().protostate() ===
    Superclass.prototype.state('A').call('protostate')
  );
  assert.ok(
    o.protostate().protostate() === undefined
  );

  assert.ok( o.m() === "FOOBARBAZ" );
})


}( jQuery, QUnit ) );