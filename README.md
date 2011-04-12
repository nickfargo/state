# State.js

## Usage

### Example 1

	function Animal () {
		this.move = function () {};
		State( this, {
			Stationary: {
				move: function () { return false; }
			},
			Moving: {
				move: function () { return true; }
			}
		}, 'Stationary' );
	}

	var animal = new Animal();
	animal.move(); // false
	animal.state.change('Moving');
	animal.move(); // true
	animal.state.change('');
	animal.move(); // undefined
