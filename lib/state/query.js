// ### [`state/query.js`](#state--query.js)

O.assign( State.prototype, {

    // #### [query](#state--prototype--query)
    // 
    // Matches a `selector` string with the state or states it represents,
    // evaluated first in the context of `this`, then its substates, and then
    // its superstates, until all locations in the state tree have been
    // searched for a match of `selector`.
    // 
    // Returns the matched [`State`](#state), or an `Array` containing the set
    // of matched states. If a state to be tested `against` is provided, a
    // `Boolean` is returned, indicating whether `against` is the matched state
    // or is included in the matching set.
    // 
    // Setting `descend` to `false` disables recursion through the substates of
    // `this`, and likewise setting `ascend` to `false` disables the subsequent
    // recursion through its superstates.
    // 
    // *Alias:* **match**
    //
    // > [Selectors](/docs/#concepts--selectors)
    // > [query](/api/#state--methods--query)
    'query match': function (
         /*String*/ selector,
          /*State*/ against, // optional
        /*Boolean*/ descend, // = true
        /*Boolean*/ ascend,  // = true
        /*Boolean*/ viaProto // = true
    ) {
        var parts, cursor, next, result, i, l, name,
            queue, subject, substates, state, superstate, protostate;

        if ( typeof against === 'boolean' ) {
            ascend = descend; descend = against; against = undefined;
        }
        descend === undefined && ( descend = true );
        ascend === undefined && ( ascend = true );
        viaProto === undefined && ( viaProto = true );

        // A few exceptional cases may be resolved early.
        if ( selector == null ) {
            return against !== undefined ? false : null;
        }
        if ( selector === '.' ) {
            return against !== undefined ? against === this : this;
        }
        if ( selector === '' ) {
            return against !== undefined ?
                against === this.root() :
                this.root();
        }

        // Absolute wildcard expressions compared against the root state pass
        // immediately.
        if ( against && against === this.root() &&
                selector.search( rxWildcardsOnly ) === 0
        ) {
            return true;
        }

        // Pure `.`/`*` expressions should not be recursed.
        if ( selector.search( rxDotsAndWildcardsOnly ) === 0 ) {
            descend = ascend = false;
        }

        // If `selector` is an absolute path, evaluate it from the root state
        // as a relative path.
        if ( selector.charAt(0) !== '.' ) {
            return this.root().query( '.' + selector, against, descend, false );
        }

        // An all-`.` `selector` must have one `.` trimmed to parse correctly.
        selector = selector.replace( rxDotsOnlyMinusOne, '$1' );

        // Split `selector` into tokens, consume the leading empty-string
        // straight away, then parse the remaining tokens. A `cursor` reference
        // to a matching [`State`](#state) in the tree is kept, beginning with
        // the context state (`this`), and updated as each token is consumed.
        parts = selector.split('.');
        for ( i = 1, l = parts.length, cursor = this; cursor; i++ ) {

            // Upon reaching the end of the token stream, return the
            // [`State`](#state) currently referenced by `cursor`.
            if ( i >= l ) return against ? against === cursor : cursor;

            // Consume a token.
            name = parts[i];

            // Interpret a **single wildcard** as any *immediate* substate of
            // the `cursor` state parsed thus far.
            if ( name === '*' ) {
                if ( !against ) return cursor.substates();
                else if ( cursor === against.superstate() ) return true;
                else break;
            }

            // Interpret a **double wildcard** as any descendant state of the
            // `cursor` state parsed thus far.
            else if ( name === '**' ) {
                if ( !against ) return cursor.substates( true );
                else if ( cursor.isSuperstateOf( against ) ) return true;
                else break;
            }

            // Empty string, the product of leading/consecutive dots, implies
            // `cursor`’s superstate.
            else if ( name === '' ) {
                cursor = cursor.superstate();
            }

            // Interpret any other token as an identifier that names a specific
            // substate of `cursor`.
            else if ( next = cursor.substate( name ) ) {
                cursor = next;
            }

            // If no matching substate exists, the query fails for this
            // context.
            else break;
        }

        // If the query has failed, then recursively descend the tree,
        // breadth-first, and retry the query with a different context.
        if ( descend ) {
            queue = [ this ];
            while ( subject = queue.shift() ) {
                substates = subject.substates( false, true );
                for ( i = 0, l = substates.length; i < l; i++ ) {
                    state = substates[i];

                    // The `ascend` block uses `descend` to indicate a substate
                    // that has already been searched.
                    if ( state === descend ) continue;

                    result = state.query( selector, against, false, false,
                        false );

                    if ( result ) return result;

                    queue.push( state );
                }
            }
        }

        // If the query still hasn’t succeeded, then recursively ascend the
        // tree and retry, but also passing `this` as a domain to be skipped
        // during the superstate’s subsequent descent.
        if ( ascend && ( superstate = this.superstate() ) ) {
            result = superstate.query( selector, against, descend && this,
                true, false );
            if ( result ) return result;
        }

        // If the query still hasn’t succeeded, then retry the query on the
        // protostate.
        if ( viaProto && ( protostate = this.protostate() ) ) {
            result = protostate.query( selector, against, descend, ascend,
                true );
            if ( result ) return result;
        }

        // All possibilities exhausted; no matches exist.
        return against ? false : null;
    },

    // #### [$](#state--prototype--dollarsign)
    // 
    // Convenience method that either aliases to
    // [`change`](#state--prototype--change) if passed a function for the first
    // argument, or aliases to [`query`](#state--prototype--query) if passed a
    // string — thereby mimicking the behavior of the object’s accessor method.
    // 
    // > See also:
    // [`StateController createAccessor`](#state-controller--private--create-accessor)
    $: function ( expr ) {
        var args, match, method;
        if ( typeof expr === 'function' ) {
            args = O.slice.call( arguments );
            args[0] = expr = expr();
            if ( expr ) return this.change.apply( this, args );
        }
        else if ( typeof expr === 'string' &&
            ( match = expr.match( rxTransitionArrow ) ) &&
            ( method = transitionArrowMethods[ match[1] ] )
        ) {
            if ( arguments.length > 1 ) {
                return this[ method ].apply( this, [ match[2] ]
                    .concat( O.slice.call( arguments, 1 ) ) );
            } else return this[ method ]( match[2] );
        }
        else return this.query.apply( this, arguments );
    }
});
