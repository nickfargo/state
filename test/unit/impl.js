// Adding state to a new generic object using State
var X = State.object(
	// Object definition
	{
		methodOne: function() {
			return 'methodOne';
		},
		methodTwo: function() {
			return 'methodTwo';
		}
	},
	
	// State definitions
	// Three progressively more complex ways to define a state:
	{
		// 1. Simple: methods only
		Preparing: {
			methodOne: function() {
				return 'Preparing.methodOne';
			}
		},
		
		// 2. Compound (inside array literal): methods plus events
		Ready: [
			// [0]: methods
			{
				methodTwo: function() {
					return 'Ready.methodTwo';
				}
			},
			// [1]: events
			{
				// event with one listener declared
				enter: function(event) {
					console.log( event.name + '.' + event.type + ' ' + event );
				},
				
				// event with multiple listeners declared
				leave: [
					function(event) {
						console.log( event.name + '.' + event.type + ' 1 ' + event );
					},
					function(event) {
						console.log( event.name + '.' + event.type + ' 2 ' + event );
					}
				]
			}
		],
		
		// 3. Complex (StateDefinition): named sections for any or all of methods, events, rules ...?
		Finished: State({
			methods: {
				methodOne: function() {
					return 'Finished.methodOne';
				},
				methodTwo: function() {
					return 'Finished.methodTwo';
				}
			},
			events: {
				enter: function(event) {
					console.log( event.name + '.' + event.type + ' ' + event );
				},
				leave: [
					function(event) {},
					function(event) {}
				]
			},
			rules: {
				allowLeavingTo: {
					Preparing: function() { return false; },
					Ready: function() { return false; },
					
					// "." references current state ('Finished')
					'.CleaningUp': true
				},
				allowEnteringFrom: {
					// TODO: support multiples with comma-delimited keys
					'Preparing, Ready': function() { return true; }
				}
			},
			states: {
				CleaningUp: {
					methodTwo: function() {
						return 'Finished.CleaningUp.methodTwo';
					}
				},
				Terminated: State({
					methods: {
						methodOne: function() {
							return 'Finished.Terminated.methodOne';
						},
						methodTwo: function() {
							return 'Finished.Terminated.methodTwo';
						}
					},
					rules: {
						allowLeavingTo: {
							// empty string references the controller's default state
							'': function(state) {
								// "this" references current state ('Finished.Terminated')
								// "state" references state to which controller is being changed ('')
								console.warn( 'Denying exit from ' + this.toString() + ' to ' + state.toString() );
								return false;
							},
							// TODO: support wildcard
							'*': true
						},
						allowEnteringFrom: {
							// TODO: support dot syntax
							'..CleaningUp': function() { return true; },
							'...Preparing': function() { return true; },
							
							// "." references current state ('Finished.Terminated')
							
							// ".." references parent default state ('Finished')
							'..': true,
							
							// ".*" references any child state of parent state
							'.*': function() { return false; }
							
							// ".**" references any descendant state of parent state
						}
					},
					states: {
						// et cetera
					}
				})
			}
		})
	},
	
	// initial state selector
	'Preparing'
);
console.log(X);

// Adding arbitrary state to an existing generic object using State.Controller
//
// Note how this approach allows implementors to specify their own reference
// to the state controller, as opposed to the default of owner.state
// 
// This also allows for the definition of multiple state controllers, though
// it is the implementor's responsibility to keep their method manipulations
// from colliding
Y = {
	methodThree: function() {
		return 'methodThree';
	},
	methodFour: function() {
		return 'methodFour';
	}
};
Y.state = State.Controller( Y, {
	Rising: [
		{
			methodThree: function() {
				return 'Rising.methodThree';
			}
		},{
			enter: function(event) {
				console.log( event.name + '.' + event.type + ' Up up and away!' );
			},
			leave: function(event) {
				console.log( "Dude I'm so high" );
			}
		}
	],
	Falling: [
		{
			methodFour: function() {
				return 'Falling.methodFour';
			}
		},{
			enter: function(event) {
				console.log( event.name + '.' + event.type + ' Aaaaaaaaaaaaaa!' );
			},
			leave: function(event) {
				console.log( "Man I'm so down" );
			}
		}
	]
});
// Adding a new state to an existing controller
Y.state.addState(
	'Gliding', {
		methodThree: function() {
			return this.state.is() + '.methodThree';
		},
		methodFour: function() {
			return this.state.is() + '.methodFour';
		}
	}, {
		enter: function(event) {
			console.log( event.name + '.' + event.type + ' Zzzzzzzz...' );
		},
		leave: function(event) {
			console.log( event.name + '.' + event.type + ' Time to move again!' );
		}
	}, {
		allowLeavingTo: {
			Rising: function() {
				console.log( state + ' disallows change to ' + toState );
				return false;
			},
			Falling: function() {
				console.log( state + ' allows change to ' + toState );
				return true;
			}
		},
		allowEnteringFrom: function( fromState ) {
			var state = this;
			console.log( state + ' allows change from any state' );
			return true;
		}
	}
);

// Adding inheritable state to an instantiated object from within its
// constructor using State(this, ...)
function Z() {
	this.move = function() {
		console.log("I can't move!");
	};
	State(
		this,
		{
			Walking: {
				move: function() {
					console.log('Andante!');
				}
			},
			Running: {
				move: function() {
					console.log('Presto!');
				}
			},
			Falling: {
				move: function() {
					console.log('Geronimo!');
				}
			}
		},
		'Walking'
	);
}
