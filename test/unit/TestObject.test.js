( function( $, undefined ) {

window.TestObject = [
	function TestObject( initialState ) {
		$.extend( this, {
			methodOne: function() {
				return 'methodOne';
			},
			methodTwo: function() {
				return 'methodTwo';
			}
		});

		// State definitions
		State.object( this,

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
							event.log();
						},

						// event with multiple listeners declared
						leave: [
							function(event) {
								event.log('1');
							},
							function(event) {
								event.log('2');
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
						methodThree: function( uno, dos ) {
							return 'Finished.methodThree uno='+uno+' dos='+dos;
						}
					},
					events: {
						enter: function(event) {
							event.log();
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

							// leading "." references current state ('Finished.')
							'.CleaningUp': true
						},
						allowEnteringFrom: {
							'Preparing, Ready': function(state) {
								console.log( 'Finished.allowEnteringFrom ' + state );
								return true;
							}
						}
					},
					states: {
						CleaningUp: {
							methodTwo: function() {
								return 'Finished.CleaningUp.methodTwo';
							}
						},
						Terminated: {
							methods: {
								methodTwo: function() {
									return 'Finished.Terminated.methodTwo';
								},
								methodThree: function( uno, dos ) {
									var result = 'Finished.Terminated.methodThree';
									result += ' : ' + this.state.superstate('methodThree')( uno, dos );
									return result;
								}
							},
							rules: {
								allowLeavingTo: {
									// empty string references the controller's default state
									'': function( state ) {
										// "this" references current state ('Finished.Terminated')
										// "state" references state to which controller is being changed ('')
										console.warn( 'Denying exit from ' + this.toString() + ' to ' + state.toString() );
										return false;
									},
									'*': true
								},
								allowEnteringFrom: {
									'..CleaningUp': function() { return true; },
									'...Preparing': function() { return true; },

									// "." references current state ('Finished.Terminated')

									// ".." references parent state ('Finished')
									'..': true,

									// "..." references root default state ('' == controller().defaultState())

									// ".*" references any child state of parent state
									'.*': function() { return false; },

									// ".**" references any descendant state of parent state
									'.**': function() { return true; }
								}
							},
							states: {
								// et cetera
							}
						}
					}
				})
			},

			// initial state selector
			initialState === undefined ? 'Preparing' : initialState
		);
	}
];

})( jQuery );