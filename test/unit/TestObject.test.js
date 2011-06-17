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

			// 2. Compound: methods plus events
			Ready: {
				methodTwo: function () {
					return 'Ready.methodTwo';
				},
				
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
				],
				
				admit: true,
				
				Champing: {
					data: {
						description: "I'm really ready"
					}
				},
				
				wiggle: State.Transition({})
			},

			// 3. Complex: named categories
			Finished: {
				data: {
					a: 1,
					b: 'deux',
					c: false,
					d: {
						a: 'deep',
						b: 'thoughts'
					}
				},
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
					release: {
						Preparing: function () { return false; },
						Ready: function () { return false; },

						// leading "." references current state ('Finished.')
						'.CleaningUp': true
					},
					admit: {
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
						},
						terminate: function () { return this.select( '..Terminated' ); },
						
						arrive: function ( event ) {
							event.log( "I'm an event" );
						}
						
						// weee: State.Transition({})
					},
					Terminated: {
						data: {
							a: 2,
							b: 'trois',
							d: {
								b: 'impact'
							}
						},
						methods: {
							methodTwo: function () {
								return 'Finished.Terminated.methodTwo';
							},
							methodThree: function ( uno, dos ) {
								var result = 'Finished.Terminated.methodThree';
								result += ' : ' + this.superstate().method('methodThree')( uno, dos );
								return result;
							}
						},
						rules: {
							release: {
								// empty string references the controller's default state
								'': function ( state ) {
									// "this" references current state ('Finished.Terminated')
									// "state" references state to which controller is being changed ('')
									console && console.log( 'Denying departure from ' + this + ' to ' + state );
									return false;
								},
								'*': true
							},
							admit: {
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
							ReallyDead: {
							}
							// et cetera
						}
					}
				},
				transitions: {
					'transitionName': {
						origin: '*',
						operation: function () {
							// do some business
							console && console.log( Date.now() + "OPERATION HERE I AM" );
							// debugger;
							var self = this;
							// setTimeout( function () {
							// 	self.end();
							// 	console && console.log( Date.now() + "OPERATION I'M DONE GET ON WITH IT" );
							// 	// start();
							// }, 1000 );
							this.end();
						},
						operations: [
							[[
								function () {},
								function () {},
								function () {}
							]],
							[
								function () {},
								function () {}
							]
						]
					},
					Transition2: {
						// origin: '*',
						// destination: '.',
						operation: function () { this.end(); }
					}
				}
			}
		},

		// initial state selector
		initialState === undefined ? 'Preparing' : initialState
	);
};

})( jQuery );