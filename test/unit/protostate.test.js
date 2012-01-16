function Animal () {
	this.move = function () { return 0; };
	state( this, {
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
	state( this, {
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
	state( this, {
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


1&&
( function ( assert, undefined ) {

module( "Protostate" );

test( "Animal", function () {
	var animal = new Animal();
	assert.strictEqual( animal.move(), false );
	assert.strictEqual( animal.getThis(), animal.state('Stationary') );
	animal.state().change('Moving'), assert.strictEqual( animal.move(), true );
	animal.state().change(''), assert.strictEqual( animal.move(), 0 );
});

test( "Bird", function () {
	var bird = new Bird();
	assert.strictEqual( bird.constructor, Bird );
	
	var prototype = bird.constructor.prototype;
	assert.ok( prototype instanceof Animal && !( prototype instanceof Bird ) );
	
	var protostate = bird.state().defaultState().protostate();
	assert.ok( protostate );
	assert.ok( protostate.owner() === prototype );
	assert.ok( protostate.controller().defaultState() === protostate );
	
	assert.strictEqual( bird.move(), false );
	assert.strictEqual( bird.getThis(), bird.state('Stationary') );
	bird.state().change('Moving'), assert.strictEqual( bird.move(), true );
	bird.state().change('.Flying'), assert.strictEqual( bird.move(), "Flap flap" );
	bird.state().change('..Ambulating'), assert.strictEqual( bird.move(), "Waddle waddle" );
	bird.state().change('.'), assert.strictEqual( bird.move(), true );
	bird.state().change('Stationary'), assert.strictEqual( bird.move(), false );
	bird.state().change(''), assert.strictEqual( bird.move(), 0 );
});

test( "Ostrich", function () {
	var ostrich = new Ostrich();
	assert.strictEqual( ostrich.move(), 0 );
	ostrich.state().change('Moving'), assert.strictEqual( ostrich.move(), true );
	ostrich.state().change('.Flying'), assert.strictEqual( ostrich.move(), undefined );
	ostrich.state().change('..Ambulating'), assert.strictEqual( ostrich.move(), "Waddle waddle" );
	ostrich.state().change('.Walking'), assert.strictEqual( ostrich.move(), "Stomp stomp" );
	ostrich.state().change('..Running'), assert.strictEqual( ostrich.move(), "Thumpthumpthumpthump" );
	ostrich.state().change('....Stationary.HeadBuried'), assert.strictEqual( ostrich.move(), "Buttwiggle" );
	ostrich.state().change('Moving.Kicking'), assert.strictEqual( ostrich.move(), "Pow!" );
});

})( QUnit || require('assert') );