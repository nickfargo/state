var TransitionDefinition = ( function () {
	var	propertyList = Z.setAll( Z.splitToHash( 'origin source target operation' ), null ),
		categoryList = Z.setAll( Z.splitToHash( 'methods events' ), null );
	
	function TransitionDefinition ( map ) {
		if ( !( this instanceof TransitionDefinition ) ) {
			return new TransitionDefinition( map );
		}
		Z.extend( true, this, map instanceof TransitionDefinition ? map : desugar( map ) );
	}

	function desugar ( map ) {
		var	result = Z.extend( {}, propertyList, categoryList ),
			eventTypes = Z.invert( Transition.Event.types ),
			key, value, category, events;
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			if ( key in propertyList ) {
				result[ key ] = value;
			}
			else if ( key in categoryList ) {
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
