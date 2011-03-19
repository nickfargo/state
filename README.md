# State.js

## Example

### Synopsis
Let's consider an object that outputs a simple greeting, and is able to do so in several languages — a typical example of a state machine.

The basic form might look like this plain JavaScript object:
	var polyglot = {
		greet: function() { return ':)'; }
	}
### Adding state
State.js, our `polyglot`'s multilingual behavior can then be added as distinct language states, like so:
	State( polyglot, {
		French: {
			greet: function() { return 'Bonjour !'; }
		},
		Spanish: {
			greet: function() { return '¡Hola!'; }
		},
		English: {
			methods: {
				greet: function() { return 'Hello!'; }
			},
			states: {
				American: {
					greet: function() { return 'Howdy!'; }
				}
			}
		}
	});
Note the concise definitions for the first two language states, while the more complex `English` state expands this syntax to define both a method and a substate.

### Putting states to work
Our `polyglot` is now language-aware and ready to use. It can be placed into any of the language states we've defined, and calls to `polyglot.greet()` will return the appropriate expression in each case.
	polyglot.greet(); // :)

	polyglot.state.change('French');
	polyglot.greet(); // Bonjour !

	// Using a direct reference
	polyglot.state.English.select();
	polyglot.greet(); // Hello!

	// The method call can be chained to the end of change()
	polyglot.state.change('Spanish').greet(); // ¡Hola!

	// Changing to a substate
	polyglot.state.change('English.American').greet(); // Howdy!

	// Changing back to the default state using the empty string key
	polyglot.state.change('').greet(); // :)
