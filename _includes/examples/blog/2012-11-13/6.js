var exported = ( function () {
  var closed = {};

  function Class() {}
  state( Class.prototype, 'abstract', {
    A: state( 'default', {
      normal: function () { return { closed: closed }; },
      
      bound: state.method({ c: closed }, function() {
        return {
          c: c,
          autostate: autostate,
          protostate: protostate,
          'this': this
        };
      })
    })
  });

  var o = new Class;
  state( o, {
    A: {
      normal: function ( param ) {
        return { param: param, closed: closed };
      },

      alsoBound: state.method({ closed: closed })
        ( function ( param ) {
          return {
            param: param,
            closed: closed,
            autostate: autostate,
            protostate: protostate,
            'this': this
          };
        });
    }
  });

  return { closed: closed, Class: Class, o: o };
})();

var closed = exported.closed;
var Class = exported.Class;
var o = exported.o;


var stuff;

stuff = o.bound();
stuff.closed === closed;                          // >>> true
stuff.autostate === Class.prototype.state('A');   // >>> true
stuff.protostate === null;                        // >>> true

stuff = o.alsoBound("argument");
stuff.param === "argument";                       // >>> true
stuff.closed === closed;                          // >>> true
stuff.autostate === o.state('A');                 // >>> true
stuff.protostate === Class.prototype.state('A');  // >>> true