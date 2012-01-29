var StateDefinition = ( function () {
	var	categoryList   = Z.assign( STATE_DEFINITION_CATEGORIES ),
		eventTypes     = Z.assign( STATE_EVENT_TYPES ),
		guardActions   = Z.assign( GUARD_ACTIONS );

	function StateDefinition ( attributes, map ) {
		if ( !( this instanceof StateDefinition ) ) {
			return new StateDefinition( attributes, map );
		}

		typeof attributes === 'string' ?
			map || ( map = {} ) :
			map || ( map = attributes, attributes = undefined );
		
		Z.extend( true, this, map instanceof StateDefinition ? map : interpret( map ) );

		attributes == null || Z.isNumber( attributes ) || ( attributes = encode( attributes ) );
		this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
	}

	function encode ( attributes ) {
		var	key,
			result = STATE_ATTRIBUTES.NORMAL;
		
		typeof attributes === 'string' && ( attributes = Z.assign( attributes ) );

		for ( key in attributes ) {
			if ( ( key = key.toUpperCase() ) in STATE_ATTRIBUTES ) {
				result |= STATE_ATTRIBUTES[ key ];
			}
		}
		
		return result;
	}

	function interpret ( map ) {
		var	key, value, category,
			result = Z.setAll( Z.extend( {}, categoryList ), null );
		
		for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
			value = map[ key ];
			
			// Priority 1: nominative type match for items that are explicit definition instances
			category =
				value instanceof StateDefinition && 'states' ||
				value instanceof TransitionDefinition && 'transitions';
			if ( category ) {
				( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
			}
			
			// Priority 2: explicitly named category object
			else if ( key in result ) {
				result[ key ] = Z.extend( result[ key ], value );
			}
			
			// Priority 3: implicit categorization
			else {
				category =
					key in eventTypes ? 'events' :
					key in guardActions ? 'guards' :
					Z.isPlainObject( value ) ? 'states' :
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
				new TransitionDefinition( map );
		});
		
		Z.each( result.states, function ( name, map ) {
			result.states[ name ] = map instanceof StateDefinition ?
				map :
				new StateDefinition( map );
		});
		
		return result;
	}

	return StateDefinition;
})();
