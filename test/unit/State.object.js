var testObject;

module( "State.object" );

test( "Object creation", function() {

	var x = testObject = State.object(
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
			
			// 3. Complex (StateDefinition): named sections
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
	
	// test integrity
	ok( x instanceof State );
	
});


test( "Null state transition", function() {
	var x = testObject;
	ok( x.state.change('Preparing') instanceof State );
});

test( "Simple state transitions", function() {
	var x = testObject;
	ok( x.state.change('Ready') );
	ok( x.state.change('Finished') );
});

test( "State transitions from parent state into child state", function() {
	
});
