// <a class="icon-link"
//    name="state--expression.js"
//    href="#state--expression.js"></a>
// 
// ### `state/expression.js`

// <a class="icon-link"
//    name="state--privileged--express"
//    href="#state--privileged--express"></a>
// 
// #### express
// 
// Returns an expression of the state of `this` state — a snapshot of `this`
// state’s current contents.
State.privileged.express = ( function () {
    function clone ( obj ) {
        if ( obj === undefined ) return;
        var out = null, key, value;
        for ( key in obj ) {
            value = obj[ key ];
            ( out || ( out = {} ) )[ key ] =
                value && typeof value === 'object' ?
                    O.clone( obj[ key ] ) :
                    value;
        }
        return out;
    }

    function cloneEvents ( events ) {
        if ( events === undefined ) return;
        var out = null, type, emitter;
        for ( type in events ) if ( emitter = events[ type ] ) {
            ( out || ( out = {} ) )[ type ] = O.clone( emitter.items );
        }
        return out;
    }

    function recurse ( substates, typed ) {
        if ( substates === undefined ) return;
        var out = null;
        O.forEach( substates, function ( substate, name ) {
            ( out || ( out = {} ) )[ name ] = substate.express( typed );
        });
        return out;
    }

    // By default the returned expression is returned as a plain `Object`; if
    // `typed` is truthy, the expression is a formally typed
    // [`StateExpression`](#state-expression).
    return function (
        /*Function*/ ExpressionConstructor,
          /*Number*/ attributes,
          /*Object*/ data, methods, events, guards, substates, transitions
    ) {
        return function ( /*Boolean*/ typed ) {
            var expression = {};

            O.edit( expression, {
                attributes:  attributes,
                data:        clone( data ),
                methods:     clone( methods ),
                events:      cloneEvents( events ),
                guards:      clone( guards ),
                states:      recurse( substates, typed ),
                transitions: clone( transitions )
            });

            return typed ?
                new ExpressionConstructor( expression ) :
                expression;
        };
    };
}() );

State.prototype.express = O.noop;
