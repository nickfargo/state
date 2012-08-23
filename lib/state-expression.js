// ## [StateExpression](#state-expression)
// 
// A **state expression** formalizes a definition of a state’s contents.
// States are declared by calling the module’s exported [`state()`](#module)
// function and passing it an object map containing the definition. This
// input may be expressed in a shorthand format, which the
// [`StateExpression`](#state-expression)
// [constructor](#state-expression--constructor) rewrites into unambiguous
// long form, which can be used later to create [`State`](#state) instances.
var StateExpression = ( function () {
    var attributeMap =
            O.forEach( O.assign( STATE_ATTRIBUTE_MODIFIERS ),
                function ( value, key, object ) {
                    object[ key ] = key.toUpperCase();
                }),

        attributeFlags =
            O.forEach( O.invert( STATE_ATTRIBUTES ),
                function ( value, key, object ) {
                    object[ key ] = value.toLowerCase();
                }),

        categoryMap    = O.assign( STATE_EXPRESSION_CATEGORIES ),
        eventTypes     = O.assign( STATE_EVENT_TYPES ),
        guardActions   = O.assign( GUARD_ACTIONS );

    // ### [Constructor](#state-expression--constructor)
    function StateExpression (
        /*String | Object*/ attributes, // optional
                 /*Object*/ map
    ) {
        if ( !( this instanceof StateExpression ) ) {
            return new StateExpression( attributes, map );
        }

        if ( typeof attributes === 'string' ) {
            if ( !map ) { map = {}; }
        } else {
            if ( !map ) { map = attributes; attributes = undefined; }
        }

        O.edit( 'deep all', this,
            map instanceof StateExpression ? map : interpret( map ) );

        attributes == null ?
            map && ( attributes = map.attributes ) :
            O.isNumber( attributes ) ||
                ( attributes = encodeAttributes( attributes ) );

        this.attributes = attributes || STATE_ATTRIBUTES.NORMAL;
    }

    // ### [Class functions](#state-expression--class)

    // #### [encodeAttributes](#state-expression--class--encode-attributes)
    // 
    // Returns the bit-field integer represented by the provided set of
    // attributes.
    function encodeAttributes ( /*Object | String*/ attributes ) {
        var key,
            result = STATE_ATTRIBUTES.NORMAL;

        if ( typeof attributes === 'string' ) {
            attributes = O.assign( attributes );
        }

        for ( key in attributes ) if ( O.hasOwn.call( attributes, key ) ) {
            if ( key in attributeMap ) {
                result |= STATE_ATTRIBUTES[ attributeMap[ key ] ];
            }
        }

        return result;
    }
    StateExpression.encodeAttributes = encodeAttributes;

    // #### [decodeAttributes](#state-expression--class--decode-attributes)
    // 
    // Returns the space-delimited set of attribute names represented by the
    // provided bit-field integer.
    function decodeAttributes ( /*Number*/ attributes ) {
        var key, out = [];
        for ( key in attributeFlags ) {
            attributes & key && out.push( attributeFlags[ key ] );
        }
        return out.join(' ');
    }
    StateExpression.decodeAttributes = decodeAttributes;

    // ### [Class-private functions](#state-expression--private)

    // #### [interpret](#state-expression--private--interpret)
    // 
    // Transforms a plain object map into a well-formed
    // [`StateExpression`](#state-expression), making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( /*Object*/ map ) {
        var key, value, object, category, item,
            result = O.assign( STATE_EXPRESSION_CATEGORIES, null );

        // Interpret and categorize the elements of the provided `map`.
        for ( key in map ) if ( O.hasOwn.call( map, key ) ) {
            value = map[ key ];

            // If `value` is just a reference to the exported `state` function,
            // interpret this as an empty state.
            value === state && ( value = new StateExpression );

            // **Priority 1:** Do a nominative type match for explicit
            // expression instances.
            category =
                value instanceof StateExpression && 'states' ||
                value instanceof TransitionExpression && 'transitions';
            if ( category ) {
                item = result[ category ];
                item || ( item = result[ category ] = {} );
                item[ key ] = value;
            }

            // **Priority 2:** Recognize an explicitly named category object.
            else if ( key in result && value ) {
                result[ key ] = O.clone( result[ key ], value );
            }

            // **Priority 3:** Use keys and value types to infer implicit
            // categorization.
            else {
                category =
                    key in eventTypes || typeof value === 'string' ?
                        'events' :
                    key in guardActions ?
                        'guards' :
                    O.isPlainObject( value ) ?
                        'states' :
                    O.isFunction( value ) ?
                        'methods' :
                    undefined;

                if ( category ) {
                    item = result[ category ];
                    item || ( item = result[ category ] = {} );
                    item[ key ] = value;
                }
            }
        }

        // Coerce the extracted values as necessary:

        // Event values are coerced into an array.
        object = result.events;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( typeof value === 'function' || typeof value === 'string' ) {
                object[ key ] = [ value ];
            }
        }

        // Guards are represented as a hashmap keyed by selector, so non-object
        // values are coerced into a single-element object with the value keyed
        // to the wildcard selector.
        object = result.guards;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !O.isPlainObject( value ) ) {
                object[ key ] = { '*': value };
            }
        }

        // Transition values must be a
        // [`TransitionExpression`](#transition-expression).
        object = result.transitions;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !( value instanceof TransitionExpression ) ) {
                object[ key ] = new TransitionExpression( key, value );
            }
        }

        // State values must be a [`StateExpression`](#state-expression).
        object = result.states;
        for ( key in object ) if ( O.hasOwn.call( object, key ) ) {
            value = object[ key ];
            if ( !( value instanceof StateExpression ) ) {
                object[ key ] = new StateExpression( value );
            }
        }

        return result;
    }

    return StateExpression;
}() );
