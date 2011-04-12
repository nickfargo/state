# State.js

## Usage

### Example 0

```javascript
	function Animal () {
		this.move = function () {};
	}
	var animal = new Animal();

	animal.move(); // undefined
```

### Example 1: States

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

Now `animal` has two states defined, and has declared its initial state to be `Stationary`.

	animal.move(); // false

The `State()` call yielded a new object at `animal.state`, which exposes a `change()` method that lets us change the state from `Stationary` to something else, after which we may again expect to see a different outcome for `move()`:

	animal.state.change('Moving');
	animal.move(); // true

Next we change to the **default state** and observe that `move()` now resolves to the originally defined function:

	animal.state.change('');
	animal.move(); // undefined

### Example 2: Superstates/Substates

	function Animal () {
		this.move = function () {};
		State( this, {
			Stationary: {
				move: function () { return false; }
			},
			Moving: {
				move: function () { return true; },
				Walking: {
					move: function () { return 'go'; }
				},
				Running: {
					move: function () { return 'go go go!'; }
				}
			}
		}, 'Stationary' );
	}
	var animal = new Animal();

Now `Moving` has added two **substates** to itself, and we have two more options:

	animal.state.change('Moving');
	animal.move(); // true
	animal.state.change('.Walking');
	animal.move(); // "go"
	animal.state.change('..Running');
	animal.move(); // "go go go!"

Note the relative dot syntax: `'.Walking'` was used to identify `Moving.Walking` relative to the context of the current state at the time, which was `Moving`, and `'..Running'` was used to identify `Moving.Running` once the current state had changed to `Moving.Walking`.

### Example 3: Protostates

...