var mover = {};
state( mover, {
    construct: function ( expression ) {
        console.log( "root state constructed" );
    },

    Moving: {
        construct: function ( expression ) {
            console.log( "State '" + this.name() + "' constructed" );
        },

        Walking: {
            construct: function ( expression ) {
                console.log(
                    "State '" + this.name() + "' constructed" );
            }
        }
    }
});
// log <<< State 'Walking' constructed
// log <<< State 'Moving' constructed
// log <<< root state constructed