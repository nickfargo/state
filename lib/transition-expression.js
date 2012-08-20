// ## [TransitionExpression](#transition-expression)
// 
// A [`State`](#state) may hold **transition expressions** that describe the
// transition that will take place between any two given **origin** and
// **target** states.

var TransitionExpression = ( function () {
    var properties   = O.assign( TRANSITION_PROPERTIES, null ),
        categories   = O.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = O.assign( TRANSITION_EVENT_TYPES ),
        guardActions = O.assign( GUARD_ACTIONS );

    // ### [Constructor](#transition-expression--constructor)
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        O.edit( 'deep all', this,
            map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // ### [Class-private functions](#transition-expression--private)

    // #### [interpret](#transition-expression--private--interpret)
    // 
    // Rewrites a plain object map as a well-formed
    // [`TransitionExpression`](#transition-expression), making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var key, value, category, events, item,
            result = O.assign( {}, properties, categories );

        for ( key in map ) if ( O.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                result[ key ] = O.clone( result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ?
                        'events' :
                    key in guardActions ?
                        'guards' :
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
        for ( key in ( events = result.events ) ) {
            value = events[ key ];
            if ( O.isFunction( value ) ) {
                events[ key ] = [ value ];
            }
        }

        return result;
    }

    return TransitionExpression;
}() );
