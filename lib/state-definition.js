// <a id="state-definition" />

// ## StateDefinition
// 
// A state **definition** is a formalization of a state’s contents. States are declared by calling
// the module’s exported `state()` function and passing it an object map containing the definition.
// This input may be expressed in a shorthand format, which the `StateDefinition` constructor
// rewrites into unambiguous long form, which can be used later to create `State` instances.

var StateDefinition = ( function () {
    var attributeMap   = Z.forEach( Z.assign( STATE_ATTRIBUTE_MODIFIERS ),
            function ( value, key, object ) { object[ key ] = key.toUpperCase(); }),
        categoryMap    = Z.assign( STATE_DEFINITION_CATEGORIES ),
        eventTypes     = Z.assign( STATE_EVENT_TYPES ),
        guardActions   = Z.assign( GUARD_ACTIONS );

    // ### Constructor
    function StateDefinition (
        /*String | Object*/ attributes, // optional
                 /*Object*/ map
    ) {
        if ( !( this instanceof StateDefinition ) ) {
            return new StateDefinition( attributes, map );
        }

        typeof attributes === 'string' ?
            map || ( map = {} ) :
            map || ( map = attributes, attributes = undefined );
        
        Z.extend( true, this, map instanceof StateDefinition ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            Z.isNumber( attributes ) || ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // ### Static functions

    // #### encodeAttributes
    // 
    // Transforms the provided set of attributes into a bit field integer.
    function encodeAttributes ( /*Object | String*/ attributes ) {
        var key,
            result = STATE_ATTRIBUTES.NORMAL;

        typeof attributes === 'string' && ( attributes = Z.assign( attributes ) );

        for ( key in attributes ) {
            if ( Z.hasOwn.call( attributes, key ) && key in attributeMap ) {
                result |= STATE_ATTRIBUTES[ attributeMap[ key ] ];
            }
        }

        return result;
    }

    // #### interpret
    // 
    // Transforms a plain object map into a well-formed `StateDefinition`, making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category,
            result = Z.assign( STATE_DEFINITION_CATEGORIES, null );
        
        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            
            // **Priority 1:** Do a nominative type match for explicit definition instances.
            category =
                value instanceof StateDefinition && 'states' ||
                value instanceof TransitionDefinition && 'transitions';
            if ( category ) {
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }
            
            // **Priority 2:** Recognize an explicitly named category object.
            else if ( key in result ) {
                result[ key ] = Z.extend( result[ key ], value );
            }
            
            // **Priority 3:** Use keys and value types to infer implicit categorization.
            else {
                category =
                    key in eventTypes ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isPlainObject( value ) ? 'states' :
                    'methods';
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }
        }
        
        object = result.events;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            Z.isFunction( value = object[ key ] ) && ( object[ key ] = [ value ] );
        }
        
        object = result.transitions;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof TransitionDefinition ||
                ( object[ key ] = new TransitionDefinition( value ) );
        }
        
        object = result.states;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof StateDefinition ||
                ( object[ key ] = new StateDefinition( value ) );
        }
        
        return result;
    }

    return StateDefinition;
})();
