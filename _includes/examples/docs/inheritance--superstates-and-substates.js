var player = {};
state( player, {
    Alive: state({
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
            this.weapon.drop();
        }
    })
});

var weapon = {};
state( weapon, {
    drop: function () {
        this.state('-> Dropped');
    },

    Stowed: state,
    Holstered: state,
    Held: state({
        Drawn: state({
            Sighted: state
        })
    }),
    Dropped: state({
        drop: function () {} // no-op
    })
});
