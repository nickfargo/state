# State.js

## Synopsis

Consider an object that outputs a simple greeting, and is able to do so in several languages — a typical example of a state machine.

The object's basic form might look like this:
	var polyglot = {
		greet: function() { return ':)'; }
	}
With State.js, the object's multilingual behavior can then be added in the form of language states, like so:
	State( polyglot, 'language', {
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
Now our `polyglot` is ready to use. It can be placed into any of the language states we've defined, and calls to `polyglot.greet()` will return the proper expression.
	polyglot.greet(); // :)

	polyglot.state.change('French');
	polyglot.greet(); // Bonjour !

	polyglot.state.change('English');
	polyglot.greet(); // Hello!

	polyglot.state.change('Spanish').greet(); // ¡Hola!

	polyglot.state.change('English.American').greet(); // Howdy!

	polyglot.state.change('').greet(); // :)
