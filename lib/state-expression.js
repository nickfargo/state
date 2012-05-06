// <a name="state-expression" href="#state-expression">&#x1f517;</a>
// 
// ## StateExpression
// 
// A **state expression** formalizes a definition of a state’s contents. States are declared by
// calling the module’s exported [`state()`](#module) function and passing it an object map
// containing the definition. This input may be expressed in a shorthand format, which the
// [`StateExpression`](#state-expression) [constructor](#state-expression--constructor) rewrites
// into unambiguous long form, which can be used later to create [`State`](#state) instances.

var StateExpression = ( function () {
    var attributeMap   = Z.forEach( Z.assign( STATE_ATTRIBUTE_MODIFIERS ),
            function ( value, key, object ) { object[ key ] = key.toUpperCase(); }),
        attributeFlags = Z.forEach( Z.invert( STATE_ATTRIBUTES ),
            function ( value, key, object ) { object[ key ] = value.toLowerCase(); }),
        categoryMap    = Z.assign( STATE_EXPRESSION_CATEGORIES ),
        eventTypes     = Z.assign( STATE_EVENT_TYPES ),
        guardActions   = Z.assign( GUARD_ACTIONS );

    // <a name="state-expression--constructor"
    //    href="#state-expression--constructor">&#x1f517;</a>
    // 
    // ### Constructor
    function StateExpression (
        /*String | Object*/ attributes, // optional
                 /*Object*/ map
    ) {
        if ( !( this instanceof StateExpression ) ) {
            return new StateExpression( attributes, map );
        }

        typeof attributes === 'string' ?
            map || ( map = {} ) :
            map || ( map = attributes, attributes = undefined );

        Z.edit( 'deep all', this, map instanceof StateExpression ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            Z.isNumber( attributes ) || ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // <a name="state-expression--class"
    //    href="#state-expression--class">&#x1f517;</a>
    // 
    // ### Class functions

    // <a name="state-expression--class--encode-attributes"
    //    href="#state-expression--class--encode-attributes">&#x1f517;</a>
    // 
    // #### encodeAttributes
    // 
    // Returns the bit-field integer represented by the provided set of attributes.
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
    StateExpression.encodeAttributes = encodeAttributes;

    // <a name="state-expression--class--decode-attributes"
    //    href="#state-expression--class--decode-attributes">&#x1f517;</a>
    // 
    // #### decodeAttributes
    // 
    // Returns the space-delimited set of attribute names represented by the provided bit-field
    // integer.
    function decodeAttributes ( /*Number*/ attributes ) {
        var key, out = [];
        for ( key in attributeFlags ) attributes & key && out.push( attributeFlags[ key ] );
        return out.join(' ');
    }
    StateExpression.decodeAttributes = decodeAttributes;

    // <a name="state-expression--private"
    //    href="#state-expression--private">&#x1f517;</a>
    // 
    // ### Class-private functions

    // <a name="state-expression--private--interpret"
    //    href="#state-expression--private--interpret">&#x1f517;</a>
    // 
    // #### interpret
    // 
    // Transforms a plain object map into a well-formed [`StateExpression`](#state-expression),
    // making the appropriate inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category,
            result = Z.assign( STATE_EXPRESSION_CATEGORIES, null );

        // Interpret and categorize the elements of the provided `map`.
        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];

            // **Priority 1:** Do a nominative type match for explicit expression instances.
            category =
                value instanceof StateExpression && 'states' ||
                value instanceof TransitionExpression && 'transitions';
            if ( category ) {
                ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
            }

            // **Priority 2:** Recognize an explicitly named category object.
            else if ( key in result && value ) {
                result[ key ] = Z.edit( 'deep all', result[ key ], value );
            }

            // **Priority 3:** Use keys and value types to infer implicit categorization.
            else {
                category =
                    key in eventTypes || typeof value === 'string' ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isPlainObject( value ) ? 'states' :
                    Z.isFunction( value ) ? 'methods' :
                    undefined;
                if ( category ) {
                    ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
                }
            }
        }

        // Coerce the extracted values as necessary.

        // Event values are coerced into an array.
        object = result.events;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( typeof value === 'function' || typeof value === 'string' ) {
                object[ key ] = [ value ];
            }
        }

        // Guards are represented as a hashmap keyed by selector, so non-object values are coerced
        // into a single-element object with the value keyed to the wildcard selector.
        object = result.guards;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !Z.isPlainObject( value ) ) {
                object[ key ] = { '*': value };
            }
        }

        // Transition values must be a [`TransitionExpression`](#transition-expression).
        object = result.transitions;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof TransitionExpression ||
                ( object[ key ] = new TransitionExpression( value ) );
        }

        // State values must be a [`StateExpression`](#state-expression).
        object = result.states;
        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
            ( value = object[ key ] ) instanceof StateExpression ||
                ( object[ key ] = new StateExpression( value ) );
        }

        return result;
    }

    return StateExpression;
})();
