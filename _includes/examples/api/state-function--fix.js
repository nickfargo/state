var q = {}
state( q, {
    A: {
        ask: function ( question ) {
            if ( question == null ) return { answer: 42 };
        }
    }
});

var p = Object.create( q );
state( p, {
    A: {
        ask: state.fix( function ( autostate, protostate ) {
            return function ( question ) {
                return protostate.call( 'ask', question );
            };
        })
    }
});

var o = Object.create( p );
o.state('-> A');
o.ask( null );  // >>> { answer: 42 }
