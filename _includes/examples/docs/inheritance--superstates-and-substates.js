function Person () {
    this.give = function ( to, what ) {
        to.receive( this, what );
        return this;
    };
    this.receive = function ( from, what ) { return this; };
    
    this.greet = function () { return "Hello."; };
    
    state( this, {
        Formal: {
            greet: function ( person ) { return "How do you do?"; }
        },
        Informal: {
            greet: function ( person ) { return "Hi!"; },

            Familiar: {
                hug: function ( person ) {
                    this.owner().give( person, 'O' );
                },

                greet: function ( person ) {
                    this.owner().hug( person );
                },

                Intimate: {
                    kiss: function ( person ) {
                        this.owner().give( person, 'X' );
                    },

                    greet: function ( person ) {
                        this.superstate().call( 'greet', person );
                        this.owner().kiss( person );
                    }
                }
            }
        }
    });
}