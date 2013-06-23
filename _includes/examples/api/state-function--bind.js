var owner = {};
state( owner, {
    A: {
        inherited: function ( question ) {
            if ( question == null ) return { answer: 42 };
        },
        AA: {
            inherited: state.bind( function ( question ) {
                this.owner === owner;  // true
                this.superstate.call( 'inherited', question );
            }),
            AAA: state('initial')
        }
    }
});

owner.inherited( null );  // >>> { answer: 42 }
