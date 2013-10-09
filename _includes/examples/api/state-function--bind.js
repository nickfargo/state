var owner = {};
state( owner, {
    A: {
        ask: function ( question ) {
            if ( question == null ) return { answer: 42 };
        },
        AA: {
            ask: state.bind( function ( question ) {
                this.owner === owner;  // true
                this.superstate.call( 'ask', question );
            }),
            AAA: state('initial')
        }
    }
});

owner.ask( null );  // >>> { answer: 42 }
