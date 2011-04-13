( function ( $, undefined ) {

window.TestObject = function TestObject ( initialState ) {
	$.extend( this, {
		methodOne: function () { return 'methodOne'; }
	});
	
	// State definitions
	State( this,
		{
			methodTwo: function () { return 'methodTwo'; },
			
			// Three progressively more complex ways to define a state:
			
			// 1. Simple: methods only
			Preparing: {
				methodOne: function () {
					return 'Preparing.methodOne';
				}
			},

			// 2. Compound (inside array literal): methods plus events
			Ready: [
				// [0]: methods
				{
					methodTwo: function () {
						return 'Ready.methodTwo';
					}
				},
				// [1]: events
				{
					// event with one listener declared
					arrive: function ( event ) {
						event.log();
					},

					// event with multiple listeners declared
					depart: [
						function ( event ) {
							event.log('1');
						},
						function ( event ) {
							event.log('2');
						}
					]
				}
			],

			// 3. Complex (StateDefinition): named sections
			Finished: State({
				methods: {
					methodOne: function () {
						return 'Finished.methodOne';
					},
					methodThree: function ( uno, dos ) {
						return 'Finished.methodThree uno='+uno+' dos='+dos;
					}
				},
				events: {
					arrive: function ( event ) {
						event.log();
					},
					depart: [
						function ( event ) {},
						function ( event ) {}
					]
				},
				rules: {
					allowDepartureTo: {
						Preparing: function () { return false; },
						Ready: function () { return false; },

						// leading "." references current state ('Finished.')
						'.CleaningUp': true
					},
					allowArrivalFrom: {
						'Preparing, Ready': function ( state ) {
							console && console.log( 'Finished.allowArrivalFrom ' + state );
							return true;
						}
					}
				},
				states: {
					CleaningUp: {
						methodTwo: function () {
							return 'Finished.CleaningUp.methodTwo';
						}
					},
					Terminated: {
						methods: {
							methodTwo: function () {
								return 'Finished.Terminated.methodTwo';
							},
							methodThree: function ( uno, dos ) {
								var result = 'Finished.Terminated.methodThree';
								result += ' : ' + this.state.superstate('methodThree')( uno, dos );
								return result;
							}
						},
						rules: {
							allowDepartureTo: {
								// empty string references the controller's default state
								'': function ( state ) {
									// "this" references current state ('Finished.Terminated')
									// "state" references state to which controller is being changed ('')
									console && console.log( 'Denying departure from ' + this + ' to ' + state );
									return false;
								},
								'*': true
							},
							allowArrivalFrom: {
								'..CleaningUp': function () { return true; },
								'...Preparing': function () { return true; },

								// "." references current state ('Finished.Terminated')

								// ".." references parent state ('Finished')
								'..': true,

								// "..." references root default state ('' == controller().defaultState())

								// ".*" references any child state of parent state
								'.*': function () { return false; },

								// ".**" references any descendant state of parent state
								'.**': function () { return true; }
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
};

})( jQuery );