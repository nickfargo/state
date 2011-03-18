# State.js

## Synopsis

Consider an object that outputs a simple greeting, and is able to do so in several languages — a typical example of a state machine.

The object's basic form might look like this:
	var polyglot = {
		greet: function() { return ':)'; }
	}
Using State.js, the object's multilingual behavior can then be added in the form of language states, like so:
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
Our `polyglot` is now language-aware and ready to use. It can be placed into any of the language states we've defined, and in each case calls to `polyglot.greet()` will return the appropriate expression.
	polyglot.greet(); // :)

	polyglot.state.change('French');
	polyglot.greet(); // Bonjour !

	polyglot.state.change('English');
	polyglot.greet(); // Hello!

	// The state change and method call can be chained together
	polyglot.state.change('Spanish').greet(); // ¡Hola!

	// Changing to a substate
	polyglot.state.change('English.American').greet(); // Howdy!

	// Changing back to the default state using the empty string key
	polyglot.state.change('').greet(); // :)
