State.Definition = extend( true,
	function StateDefinition ( map ) {
		var D = State.Definition;
		if ( !( this instanceof D ) ) {
			return new D( map );
		}
		extend( true, this, map instanceof D ? map : D.expand( map ) );
	}, {
		members: [ 'methods', 'events', 'rules', 'states', 'transitions' ],
		isLongForm: function ( map ) {
			var result;
			each( this.members, function ( i, key ) {
				return !( result = ( key in map && !isFunction( map[key] ) ) );
			});
			return result;
		},
		expand: function ( map ) {
			var result = nullHash( this.members ),
				eventTypes = invert( State.Event.types );
			
			if ( isArray( map ) ) {
				each( this.members, function ( i, key ) {
					return i < map.length && ( result[key] = map[i] );
				});
			} else if ( isPlainObject( map ) ) {
				if ( this.isLongForm( map ) ) {
					extend( result, map );
				} else {
					for ( var key in map ) {
						var m = /^_*[A-Z]/.test( key ) ? 'states' : key in eventTypes ? 'events' : 'methods';
						( result[m] || ( result[m] = {} ) )[key] = map[key];
					}
				}
			}
			
			if ( result.events ) {
				each( result.events, function ( type, value ) {
					isFunction( value ) && ( result.events[type] = value = [ value ] );
					if ( !isArray( value ) ) {
						throw new Error();
					}
				});
			}
			
			if ( result.transitions ) {
				each( result.transitions, function ( name, map ) {
					result.transitions[name] = map instanceof State.Transition.Definition ? map : State.Transition.Definition( map );
					// map instanceof State.TransitionDefinition || ( map = State.Transition.Definition( map ) );
				});
			}
			
			if ( result.states ) {
				each( result.states, function ( name, map ) {
					result.states[name] = map instanceof State.Definition ? map : State.Definition( map );
					// map instanceof State.Definition || ( map = State.Definition( map ) );
				});
			}
			
			return result;
		},
		
		Set: function StateDefinitionSet ( map ) {
			each( map, function ( name, definition ) {
				if ( !( definition instanceof State.Definition ) ) {
					map[name] = State.Definition( definition );
				}
			});
			extend( true, this, map );
		}
	}
);
