state( owner, {
    A: {
        bang: function ( arg1, arg2 ) { /* ... */ },
        AA: {
            bang: state.bind( function () {
                this.owner === owner;  // true
                return this.superstate.apply( 'bang', arguments );
            })
        }
    }
});