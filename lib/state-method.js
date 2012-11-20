// ### [state.method](#module--method)
//
// Returns a `factory` to be called internally, which will flatten the scope
// of the provided `fn`, reclose it both over any provided `bindings` and over
// a static set of `lexicals` based on `autostate`, which is provided to
// `factory` as the `State` instance that will contain the **lexical state
// method** that `factory` produces.
//
// > [`state.method`](/api/#module--method)
//
// > [Lexical binding in state methods](/blog/lexical-binding-in-state-methods/)
state.method = ( function () {
    var lexicals = [ 'state', 'autostate', 'protostate' ];

    var rx = /^(function\b\s*(?:[$_A-Za-z])?\s*\((?:.*?)\)\s*\{)([\s\S]*)/;
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

            // With proper `bindings` and `fn` arguments, forward the
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

        // Gather all the identifiers that the transformed `fn` will be closed
        // over and arrange them into an array of named `params`.
        identifiers = bindings instanceof Object && O.keys( bindings ) || [];
        i = 0; l = identifiers.length; values = new Array(l);
        for ( ; i < l; i++ ) values[i] = bindings[ identifiers[i] ];
        params = identifiers.concat( lexicals );

        // Gather all the values that will be mapped to the `params`.
        args = [ state, autostate, autostate.protostate() ];
        values.length && ( args = values.concat( args ) );

        // Write the body of the function that wraps `fn`, and inject `fn` with
        // references to the superstate and owner of the context `State`.
        body = Function.prototype.toString.call( fn ).replace( rx, s );

        // Generate the wrapper function and immediately apply it with all of
        // the closed binding values.
        result = Function.apply( null, params.concat( body ) )
                         .apply( null, args );

        // Save the `factory` from which the method was created, so that the
        // method can be cloned or exported, e.g., with
        // [`express()`](/api/#state--methods--express), to a separate
        // `State`, where the method will need to be re-transformed with
        // bindings to the new state’s lexical environment.
        result.factory = factory;

        result.isLexicalStateMethod = true;

        return result;
    }

    return method;
}() );
