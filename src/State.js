var State = $.extend( true,
	function State( parent, name, definition ) {
		/*
		 * If invoked directly, use this function as shorthand for the
		 * State.Definition constructor.
		 */
		if ( !( this instanceof State ) ) {
			return State.Definition.apply( this, arguments );
		}
		
		if ( !( definition instanceof State.Definition ) ) {
			definition = State.Definition( definition );
		}
		
		var	state = this,
			methods = {},
			events = {},
			rules = {},
			substates = [],
			getName;
		
		// deprivatize these for now
		$.extend( this, {
			methods: methods,
			events: events,
			rules: rules,
			states: substates
		});

		$.extend( this, {
			name: ( getName = function() { return name || ''; } ).toString = getName,
			parent: function() { return parent; },
			method: function( methodName ) {
				return (
					methods[ methodName ]
						||
					( parent instanceof State && parent.method( methodName ) )
						||
					undefined
				);
			},
			hasMethod: function( methodName, deep ) {
				return (
					methodName in methods
						||
					deep && parent instanceof State && parent.hasMethod( methodName, deep )
				);
			},
			addMethod: function( methodName, fn ) {
				return methods[ methodName ] = fn;
			},
			removeMethod: function( methodName ) {
				var fn = methods[ methodName ];
				delete methods[ methodName ];
				return fn;
			},
			addEventListener: function( eventType, fn ) {
				var e = events[ eventType ];
				if ( !e ) {
					throw new State.EventError('Invalid event type');
				}
				return e.add(fn);
			},
			removeEventListener: function( eventType, id ) {
				return events[ eventType ].remove(id);
			},
			getEventListener: function( eventType, id ) {
				return events[ eventType ].get(id);
			},
			getEventListeners: function( eventType ) {
				return events[ eventType ];
			},
			triggerEvents: function( eventType ) {
				if ( events[ eventType ] ) {
					return events[ eventType ].trigger();
				} else {
					throw new State.EventError('Invalid event type');
				}
			},
			rule: function( ruleName ) {
				return definition.rules ? definition.rules[ ruleName ] : undefined;
			},
			addState: function( stateName, stateDefinition ) {
				var state = this[ stateName ] = new State( this, stateName, stateDefinition )
				substates.push( state );
				return state;
			},
			removeState: function() {
				throw new State.Error('Not implemented');
			},
			substates: function() {
				return substates.slice(0);
			},
			descendantStates: function() {
				var result = [];
				for ( var i in substates ) {
					result = result.concat( substates[i], substates[i].descendantStates() );
				}
				return result;
			}
		});
		
		$.each( [ 'enter', 'leave', 'enterSubstate', 'leaveSubstate' ], function( i, eventType ) {
			events[ eventType ] = new State.Event.Collection( state, eventType );
		});
		$.each({
			methods: function( methodName, fn ) {
				state.addMethod( methodName, fn );
			},
			events: function( eventType, fn ) {
				if ( fn instanceof Array ) {
					$.each( fn, function( i, fn ) {
						state.addEventListener( eventType, fn );
					});
				} else {
					state.addEventListener( eventType, fn );
				}
			},
			rules: function( ruleName, rule ) {
				rules[ ruleName ] = rule;
			},
			states: function( stateName, stateDefinition ) {
				state.addState( stateName, stateDefinition );
			}
		}, function( i, fn ) {
			if ( definition[i] ) {
				$.each( definition[i], fn );
			}
		});
	}, {
		prototype: {
			controller: function() {
				var parent = this.parent();
				return parent instanceof State ? parent.controller() : parent;
			},
			toString: function() {
				return ( this.parent() instanceof State ? this.parent().toString() + '.' : '' ) + this.name();
			},
			select: function() {
				return this.controller().changeState( this ) ? this : false;
			},
			isSelected: function() {
				return this.controller().currentState() === this;
			},
			isAncestorOf: function( state ) {
				var parent = state.parent();
				return parent instanceof State ? ( this === parent || this.isAncestorOf( parent ) ) : false;
			},
			allowLeavingTo: function( toState ) {
				return true;
			},
			allowEnteringFrom: function( fromState ) {
				return true;
			},
			evaluateRule: function( ruleName, testState ) {
				var	state = this,
					rule = this.rule( ruleName ),
					result;
				if ( rule ) {
					$.each( rule, function( selector, value ) {
						$.each( selector.split(','), function( i, expr ) {
							if ( state.match( $.trim( expr ), testState ) ) {
								result = !!( typeof value === 'function' ? value.apply( state, [testState] ) : value );
								return false; 
							}
						});
						return ( result === undefined );
					});
				}
				return ( result === undefined ) || result;
			},
			match: function( expr, testState ) {
				var	parts = expr.split('.'),
					locus = ( parts.length && parts[0] === '' ? ( parts.shift(), this ) : this.controller().defaultState() ),
					result;
				
				if ( parts.length ) {
					$.each( parts, function( i, name ) {
						if ( name === '' ) {
							locus = locus.parent();
						} else if ( locus[ name ] instanceof State ) {
							locus = locus[ name ];
						} else if ( name == '*' ) {
							result = testState ? locus === testState.parent() : locus.substates();
							return false;
						} else if ( name == '**' ) {
							result = testState ? locus.isAncestorOf( testState ) : locus.descendantStates();
							return false;
						} else {
							return result = false;
						}
					});
					return (
						result !== undefined ? result :
						!testState || locus === testState ? locus :
						false
					);
				} else {
					return locus;
				}
			}
		},
		
		object: function() {
			var controller = State.Controller.apply( this, arguments );
			controller.owner().state = controller;
			return controller.owner();
		},
		
		define: function( map ) {
			console.warn('State.define : marked for deprecation, use State.Definition() instead');
			return new State.Definition( map );
		}
	}
);
