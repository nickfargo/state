var p = Object.create( q );
p.baz = "BAZ";
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