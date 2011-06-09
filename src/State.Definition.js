State.Definition = extend( true,
	function StateDefinition ( map ) {
		var D = State.Definition;
		if ( !( this instanceof D ) ) {
			return new D( map );
		}
		extend( true, this, map instanceof D ? map : D.expand( map ) );
	}, {
		members: [ 'data', 'methods', 'events', 'rules', 'states', 'transitions' ],
		expand: function ( map ) {
			var key, category,
				result = nullHash( this.members ),
				eventTypes = invert( State.Event.types ),
				ruleTypes = invert([ 'admit', 'release' ]); // invert( State.Rule.types );
			
			for ( key in map ) {
				if ( key in result ) {
					result[key] = extend( result[key], map[key] );
				} else {
					category = /^_*[A-Z]/.test( key ) ? 'states' :
							key in eventTypes ? 'events' :
							key in ruleTypes ? 'rules' :
							'methods';
					( result[category] || ( result[category] = {} ) )[key] = map[key];
				}
			}
			
			if ( result.events ) {
				each( result.events, function ( type, value ) {
					isFunction( value ) && ( result.events[type] = value = [ value ] );
				});
			}
			
			if ( result.transitions ) {
				each( result.transitions, function ( name, map ) {
					result.transitions[name] = map instanceof State.Transition.Definition ? map : State.Transition.Definition( map );
				});
			}
			
			if ( result.states ) {
				each( result.states, function ( name, map ) {
					result.states[name] = map instanceof State.Definition ? map : State.Definition( map );
				});
			}
			
			return result;
		}
	}
);
