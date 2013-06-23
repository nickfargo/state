var q = {}
state( q, {
    A: {
        inherited: function ( question ) {
            if ( question == null ) return { answer: 42 };
        }
    }
});

var p = Object.create( q );
state( p, {
    A: {
        inherited: state.fix( function ( autostate, protostate ) {
            return function ( question ) {
                return protostate.call( 'inherited', question );
            };
        })
    }
});

var o = Object.create( p );
o.state('-> A');
o.inherited( null );  // >>> { answer: 42 }
