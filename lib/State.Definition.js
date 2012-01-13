function StateDefinition ( map ) {
	if ( !( this instanceof StateDefinition ) ) {
		return new StateDefinition( map );
	}
	Z.extend( true, this, map instanceof StateDefinition ? map : StateDefinition.expand( map ) );
}

Z.extend( true, StateDefinition, {
	categories: [ 'data', 'methods', 'events', 'guards', 'states', 'transitions' ],
	expand: function ( map ) {
		var key, value, category,
			result = nullHash( this.categories ),
			eventTypes = invert( StateEvent.types ),
			guardTypes = invert([ 'admit', 'release' ]); // invert( State.Guard.types );
		
		for ( key in map ) if ( hasOwn.call( map, key ) ) {
			value = map[key];
			
			// Priority 1 : strict type match opportunity for states and transitions
			// -- allows arbitrarily keyed values of `State({})` and `StateTransition({})`
			if ( category =
				value instanceof StateDefinition && 'states'
					||
				value instanceof StateTransitionDefinition && 'transitions'
			) {
				( result[category] || ( result[category] = {} ) )[key] = value;
			}
			
			// Priority 2 : explicitly named category
			else if ( key in result ) {
				result[key] = Z.extend( result[key], value );
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
			result.transitions[name] = map instanceof StateTransitionDefinition ? map : StateTransitionDefinition( map );
		});
		
		each( result.states, function ( name, map ) {
			result.states[name] = map instanceof StateDefinition ? map : StateDefinition( map );
		});
		
		return result;
	}
});
