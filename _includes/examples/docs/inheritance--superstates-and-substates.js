function Person () {
    this.give = function ( to, what ) {
        to.receive( this, what );
        return this;
    };
    this.receive = function ( from, what ) { return this; };
    
    this.greet = function () { return "Hello."; };
    
    state( this, {
        Formal: {
            greet: function ( other ) { return "How do you do?"; }
        },
        Informal: {
            greet: function ( acquaintance ) { return "Hi!"; },

            Familiar: {
                hug: function ( friend ) {
                    this.owner().give( friend, 'O' );
                },

                greet: function ( friend ) {
                    this.owner().hug( friend );
                },

                Intimate: {
                    kiss: function ( spouse ) {
                        this.owner().give( spouse, 'X' );
                    },

                    greet: function ( spouse ) {
                        this.superstate().call( 'greet', spouse );
                        this.owner().kiss( spouse );
                    }
                }
            }
        }
    });
}