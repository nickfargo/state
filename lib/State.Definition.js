function StateDefinition ( map ) {
	if ( !( this instanceof StateDefinition ) ) {
		return new StateDefinition( map );
	}
	Z.extend( true, this, map instanceof StateDefinition ? map : StateDefinition.desugar( map ) );
}

Z.extend( true, StateDefinition, {
	categories: [ 'data', 'methods', 'events', 'guards', 'states', 'transitions' ],
	desugar: function ( map ) {
		var key, value, category,
			result = Z.nullHash( this.categories ),
			eventTypes = Z.invert( StateEvent.types ),
			guardTypes = Z.invert([ 'admit', 'release' ]); // Z.invert( State.Guard.types );
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			
			// Priority 1 : strict type match opportunity for states and transitions
			// Allows arbitrarily keyed values of `State({})` and `Transition({})`
			if ( category =
				value instanceof StateDefinition && 'states'
					||
				value instanceof TransitionDefinition && 'transitions'
			) {
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
			
			// Priority 2 : explicitly named category
			else if ( key in result ) {
				result[ key ] = Z.extend( result[ key ], value );
			}
			
			// Priority 3 : implicit categorization
			else {
				category = /^_*[A-Z]/.test( key ) ? 'states' :
						key in eventTypes ? 'events' :
						key in guardTypes ? 'guards' :
						'methods';
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
		}
		
		Z.each( result.events, function ( type, value ) {
			Z.isFunction( value ) && ( result.events[ type ] = value = [ value ] );
		});
		
		Z.each( result.transitions, function ( name, map ) {
			result.transitions[ name ] = map instanceof TransitionDefinition ?
				map :
				TransitionDefinition( map );
		});
		
		Z.each( result.states, function ( name, map ) {
			result.states[ name ] = map instanceof StateDefinition ?
				map :
				StateDefinition( map );
		});
		
		return result;
	}
});
