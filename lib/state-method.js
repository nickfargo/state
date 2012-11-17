// ### [state.method](#module--method)
//
// Returns a `factory` that when called will flatten the scope of the provided
// `fn`, reclose it both over any provided `bindings` and over a set of
// `lexicals` based on `autostate`, the `State` instance to which `fn` is to
// be bound. The function returned by `factory` may then serve as a **lexical
// state method** of `autostate`.
//
// >
state.method = ( function () {
    var lexicals = [ 'state', 'autostate', 'protostate' ];

    var rx = /^(function\b\s*\w*\s*\((?:.*?)\)\s*\{)([\s\S]*)/;
    var s = "return $1\n" +
            "  var superstate, owner;\n" +
            "  if ( this instanceof state.State ) {\n" +
            "    superstate = this.superstate();\n" +
            "    owner = this.owner();\n" +
            "  }\n" +
            "$2;";

    function method ( bindings, fn ) {

        function factory ( autostate ) {
            // Invocation from outside the module is forbidden, as this could
            // expose `bindings`, which must remain private.
            if ( this !== __MODULE__ ) throw ReferenceError;

            // If passed proper `bindings` and `fn` arguments, forward the
            // invocation to `createMethod`.
            if ( typeof bindings === 'object' && typeof fn === 'function' ) {
                return createMethod( factory, autostate, bindings, fn );
            }

            // If passed `bindings` only, return a partially applied function
            // that accepts `fn` later.
            else if ( typeof bindings === 'object' && fn === undefined ) {
                return function ( fn ) {
                    return createMethod( factory, autostate, bindings, fn );
                };
            }

            // If passed only `fn` as the first argument, assume no `bindings`.
            else if ( typeof bindings === 'function' && fn === undefined ) {
                return createMethod( factory, autostate, null, bindings );
            }
        }
        factory.isLexicalStateMethodFactory = true;

        return factory;
    }

    function createMethod ( factory, autostate, bindings, fn ) {
        var identifiers, values, i, l, params, args, body, result;
        
        identifiers = bindings instanceof Object && O.keys( bindings ) || [];
        i = 0; l = identifiers.length; values = new Array(l);
        for ( ; i < l; i++ ) values[i] = bindings[ identifiers[i] ];

        params = identifiers.concat( lexicals );
        
        args = [ state, autostate, autostate.protostate() ];
        values.length && ( args = values.concat( args ) );

        body = Function.prototype.toString.call( fn ).replace( rx, s );
        
        result = Function.apply( null, params.concat( body ) )
                         .apply( null, args );

        result.isLexicalStateMethod = true;
        result.factory = factory;

        return result;
    }

    return method;
}() );

/\bvar\s+(?:\w+,\s*)*superstate/g;
