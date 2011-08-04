function Animal () {
	this.move = function () { return 0; };
	State( this, {
		getThis: function () { return this; },
		
		Stationary: {
			getThis: function () { return this; },
			move: function () { return false; }
		},
		Moving: {
			move: function () { return true; }
		}
	}, 'Stationary' );
}

( Bird.prototype = new Animal() ).constructor = Bird;
function Bird () {
	State( this, {
		Moving: {
			Flying: {
				move: function () { return 'Flap flap'; }
			},
			Ambulating: {
				move: function () { return 'Waddle waddle'; }
			}
		}
	}, 'Stationary' );
}

( Ostrich.prototype = new Bird() ).constructor = Ostrich;
function Ostrich () {
	State( this, {
		Stationary: {
			HeadBuried: {
				move: function () { return 'Buttwiggle'; }
			}
		},
		Moving: {
			Flying: {
				move: function () {}
			},
			Ambulating: {
				Walking: {
					move: function () { return 'Stomp stomp'; }
				},
				Running: {
					move: function () { return 'Thumpthumpthumpthump'; }
				}
			},
			Kicking: {
				move: function () { return 'Pow!'; }
			}
		}
	});
}


( function ( undefined ) {

module( "Animal.Bird" );

test( "Animal", function () {
	var animal = new Animal();
	strictEqual( animal.move(), false );
	strictEqual( animal.getThis(), animal.state.Stationary );
	animal.state.change('Moving'), strictEqual( animal.move(), true );
	animal.state.change(''), strictEqual( animal.move(), 0 );
});

test( "Bird", function () {
	var bird = new Bird();
	strictEqual( bird.move(), false );
	strictEqual( bird.getThis(), bird.state.get('Stationary') );
	bird.state.change('Moving'), strictEqual( bird.move(), true );
	bird.state.change('.Flying'), strictEqual( bird.move(), "Flap flap" );
	bird.state.change('..Ambulating'), strictEqual( bird.move(), "Waddle waddle" );
	bird.state.change('.'), strictEqual( bird.move(), true );
	bird.state.change('Stationary'), strictEqual( bird.move(), false );
	bird.state.change(''), strictEqual( bird.move(), 0 );
});

test( "Ostrich", function () {
	var ostrich = new Ostrich();
	strictEqual( ostrich.move(), 0 );
	ostrich.state.change('Moving'), strictEqual( ostrich.move(), true );
	ostrich.state.change('.Flying'), strictEqual( ostrich.move(), undefined );
	ostrich.state.change('..Ambulating'), strictEqual( ostrich.move(), "Waddle waddle" );
	ostrich.state.change('.Walking'), strictEqual( ostrich.move(), "Stomp stomp" );
	ostrich.state.change('..Running'), strictEqual( ostrich.move(), "Thumpthumpthumpthump" );
	ostrich.state.change('....Stationary.HeadBuried'), strictEqual( ostrich.move(), "Buttwiggle" );
	ostrich.state.change('Moving.Kicking'), strictEqual( ostrich.move(), "Pow!" );
});

})();