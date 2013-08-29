function Player () {
    this.health = 100;
    this.weapon = new Weapon;
}
state( Player.prototype, {
    Alive: state({
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
        Moving: state({
            drawWeapon: function () {
                this.weapon.state('-> Drawn');
            },
            Walking: state,
            Running: state({
                Sprinting: state({
                    drawWeapon: function () {
                        this.weapon.state('-> Held');
                    }
                })
            })
        })
    }),
    Dead: state({
        enter: function () {
            this.dropWeapon();
        }
    })
});

function Weapon () {}
state( Weapon.prototype, {
    Stowed: state,
    Holstered: state,
    Held: state({
        Drawn: state({
            Sighted: state
        })
    }),
    Dropped: state
});
