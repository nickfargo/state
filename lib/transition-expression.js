// <a class="icon-link"
//    name="transition-expression"
//    href="#transition-expression"></a>
// 
// ## TransitionExpression
// 
// A [`State`](#state) may hold **transition expressions** that describe the
// transition that will take place between any two given **origin** and
// **target** states.

var TransitionExpression = ( function () {
    var properties   = Z.assign( TRANSITION_PROPERTIES, null ),
        categories   = Z.assign( TRANSITION_EXPRESSION_CATEGORIES, null ),
        eventTypes   = Z.assign( TRANSITION_EVENT_TYPES ),
        guardActions = Z.assign( GUARD_ACTIONS );

    // <a class="icon-link"
    //    name="transition-expression--constructor"
    //    href="#transition-expression--constructor"></a>
    // 
    // ### Constructor
    function TransitionExpression ( map ) {
        if ( !( this instanceof TransitionExpression ) ) {
            return new TransitionExpression( map );
        }
        Z.edit( 'deep all', this,
            map instanceof TransitionExpression ? map : interpret( map ) );
    }

    // <a class="icon-link"
    //    name="transition-expression--private"
    //    href="#transition-expression--private"></a>
    // 
    // ### Class-private functions

    // <a class="icon-link"
    //    name="transition-expression--private--interpret"
    //    href="#transition-expression--private--interpret"></a>
    // 
    // #### interpret
    // 
    // Rewrites a plain object map as a well-formed
    // [`TransitionExpression`](#transition-expression), making the appropriate
    // inferences for any shorthand notation encountered.
    function interpret ( map ) {
        var key, value, category, events, item,
            result = Z.assign( {}, properties, categories );

        for ( key in map ) if ( Z.hasOwn.call( map, key ) ) {
            value = map[ key ];
            if ( key in properties ) {
                result[ key ] = value;
            }
            else if ( key in categories ) {
                result[ key ] = Z.clone( result[ key ], value );
            }
            else {
                category =
                    key in eventTypes ?
                        'events' :
                    key in guardActions ?
                        'guards' :
                    Z.isFunction( value ) ?
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
            if ( Z.isFunction( value ) ) {
                events[ key ] = [ value ];
            }
        }

        return result;
    }

    return TransitionExpression;
}() );
