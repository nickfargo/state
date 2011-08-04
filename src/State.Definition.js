function StateDefinition ( map ) {
	var D = State.Definition;
	if ( !( this instanceof D ) ) {
		return new D( map );
	}
	extend( true, this, map instanceof D ? map : D.expand( map ) );
}

State.Definition = extend( true, StateDefinition, {
	categories: [ 'data', 'methods', 'events', 'guards', 'states', 'transitions' ],
	expand: function ( map ) {
		var key, value, category,
			result = nullHash( this.categories ),
			eventTypes = invert( State.Event.types ),
			guardTypes = invert([ 'admit', 'release' ]); // invert( State.Guard.types );
		
		for ( key in map ) if ( hasOwn.call( map, key ) ) {
			value = map[key];
			
			// Priority 1 : strict type match opportunity for states and transitions
			// -- allows arbitrarily keyed values of `State({})` and `State.Transition({})`
			if ( category =
				value instanceof State.Definition && 'states'
					||
				value instanceof State.Transition.Definition && 'transitions'
			) {
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
			
			// Priority 2 : explicitly named category
			else if ( key in result ) {
				result[key] = extend( result[key], value );
			}
			
			// Priority 3 : implicit categorization
			else {
				category = /^_*[A-Z]/.test( key ) ? 'states' :
						key in eventTypes ? 'events' :
						key in guardTypes ? 'guards' :
						'methods';
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
		}
		
		each( result.events, function ( type, value ) {
			isFunction( value ) && ( result.events[type] = value = [ value ] );
		});
		
		each( result.transitions, function ( name, map ) {
			result.transitions[name] = map instanceof State.Transition.Definition ? map : State.Transition.Definition( map );
		});
		
		each( result.states, function ( name, map ) {
			result.states[name] = map instanceof State.Definition ? map : State.Definition( map );
		});
		
		return result;
	}
});
