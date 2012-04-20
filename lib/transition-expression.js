// ## TransitionExpression <a name="transition-expression" href="#transition-expression">&#x1f517;</a>
// 
// A state may hold **transition expressions** that describe the transition that will take place
// between any two given **origin** and **target** states.

var TransitionExpression = ( function () {
    var properties   = Z.assign( TRANSITION_PROPERTIES, null ),
        categories   = Z.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = Z.assign( TRANSITION_EVENT_TYPES ),
        guardActions = Z.assign( GUARD_ACTIONS );
    
    // ### Constructor
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        Z.edit( 'deep all', this, map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // ### Class-private functions

    // #### interpret
    // 
    // Rewrites a plain object map as a well-formed `TransitionExpression`, making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var result = Z.assign( {}, properties, categories ),
            key, value, category, events;
        
        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                result[ key ] = Z.edit( 'deep all', result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ? 'events' :
                    key in guardActions ? 'guards' :
                    Z.isFunction( value ) ? 'methods' :
                    undefined;
                if ( category ) {
                    ( result[ category ] || ( result[ category ] = {} ) )[ key ] = value;
                }
            }
        }
        for ( key in ( events = result.events ) ) {
            Z.isFunction( value = events[ key ] ) && ( events[ key ] = [ value ] );
        }

        return result;
    }

    return TransitionExpression;
})();
