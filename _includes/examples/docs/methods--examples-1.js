function Player () {
    this.health = 100;
    this.weapon = new Weapon;
}
state( Player.prototype, 'abstract', {
    Alive: state( 'default', {
        exit: function () {
            this.dropWeapon();
        },

        setHealth: function ( value ) {
            if ( 0 < value ) {
                this.health = value;
            } else {
                this.health = 0;
                this.state('-> Dead');
            }
        },

        pickUpWeapon: function ( weapon ) {
            this.dropWeapon();
            this.weapon = weapon;
        },
        dropWeapon: function () {
            this.weapon.state('-> Dropped');
            this.weapon = null;
        },

        Stationary: state({
            drawWeapon: function () {
                this.weapon.state('-> Sighted');
            }
        }),
        Moving: state( 'abstract', {
            drawWeapon: function () {
                this.weapon.state('-> Drawn');
            },
            Walking: state,
            Running: state( 'default', {
                Sprinting: state({
                    drawWeapon: function () {
                        this.weapon.state('-> Held');
                    }
                })
            })
        })
    }),
    Dead: state('final')
});

function Weapon () {}
state( Weapon.prototype, {
    Stowed: state,
    Holstered: state,
    Held: state({
        Drawn: state({
            fire: function () { return "Pew!"; },
            Sighted: state
        })
    }),
    Dropped: state
});
