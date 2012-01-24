var TransitionDefinition = ( function () {
	var	properties = Z.assign( TRANSITION_PROPERTIES, null ),
		categories = Z.assign( TRANSITION_DEFINITION_CATEGORIES, null );
		eventTypes = Z.assign( TRANSITION_EVENT_TYPES );
	
	function TransitionDefinition ( map ) {
		if ( !( this instanceof TransitionDefinition ) ) {
			return new TransitionDefinition( map );
		}
		Z.extend( true, this, map instanceof TransitionDefinition ? map : interpret( map ) );
	}

	function interpret ( map ) {
		var	result = Z.extend( {}, properties, categories ),
			key, value, category, events;
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			if ( key in properties ) {
				result[ key ] = value;
			}
			else if ( key in categories ) {
				Z.extend( result[ key ], value );
			}
			else {
				category = key in eventTypes ? 'events' : 'methods';
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
		}
		for ( key in ( events = result.events ) ) {
			Z.isFunction( value = events[ key ] ) && ( events[ key ] = [ value ] );
		}

		return result;
	}

	return TransitionDefinition;
})();