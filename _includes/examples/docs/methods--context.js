state( owner, {
    A: {
        bang: function ( arg1, arg2 ) { /* ... */ },
        B: {
            bang: function () {
                return this.superstate().apply( 'bang', arguments );
            }
        }
    }
});