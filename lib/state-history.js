// ## StateHistory
// 
/*
    ' * ' : the precise location within the `history` array that describes the
            present condition and composition of `this.state`
    'Sta' : any string that names a state
    'Mut' : any delta object that describes a mutation
    'NIL' : the value `Z.NIL`
    '~==' : "is essentially deep-equal to"
    '<ƒ>' : an arbitrary function
    
                                                        7         *    11
    history            : [ Sta Sta Mut Sta Mut Mut Sta Sta Mut Mut Mut Sta Mut Sta ]
    historyIndex       : 7
    stateIndices       : [ 0  1  3  6  7  11  12  14 ]
    stateIndicesIndex  : 4
    mutationOffset     : 2
              7                                           *                   11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:3} }, 'StateB' ... ]
    
    this.state.express() ~== state( 'mutable history', {
                                 data: { a:1 },
                                 methods: { b:<ƒ> },
                                 states: {
                                     StateA: {},
                                     StateB: {}
                                 }
                             })
    
    
    > this.mutate( 1 );
    mutationOffset     : 3
    
              7                                                             *   11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:NIL} }, 'StateB' ... ]
    
    this.state.express() ~== state( ...
                                 data: { a:1, c:3 },
                                 methods: { b:<ƒ> }
                             ... )
    
    
    > this.mutate( -2 );
    mutationOffset     : 1
    
              7                      *                                        11
    [ ... 'StateA', { data:{a:NIL} }, { methods:{b:<ƒ>} }, { data:{c:3} }, 'StateB' ... ]
    
    this.state.express() ~== state( ...
                                 data: { a:1 },
                                 methods: {}
                             ... )
*/

var StateHistory = ( function () {

    var guid = 0;

    function StateHistory ( /*State*/ state ) {

        // The state to which this history belongs.
        this.state = state;

        // The content of a history is stored as a “heap” of `elements`, whose keys are unique
        // decimal integers supplied by the up-scope `guid`, which map to values that are either:
        // 
        // * a `String` that uniquely identifies a previously or subsequently current `State`
        //   within the domain of `this.state`;
        // 
        // * an `Object` that represents a **mutation delta**, which contains the key-value
        //   changes between adjacent mutations of `this.state`;
        // 
        // * a `Number` that is an **element reference** that points to a superhistory element,
        //   within which is contained the information relevant to this element;
        // 
        // * or `null`, indicating a recorded period of inactivity for `this.state`.
        this.elements = {};

        // The element references of `this.elements` are indexed in an ordered list.
        this.history = [];

        // `this.historyIndex` indirectly references, via `this.history`, a state (string) element
        // within `this.elements` that names the specific `State` that is presently **current**
        // within the history.
        this.historyIndex = undefined;

        // By default a history is “deep”, in that it records a view into the timeline of its
        // client `state`, which includes the active condition of and mutations to all of the
        // state’s descendants. This is contrasted with a `shallow` history, which only records
        // the active condition of the `state`’s immediate substates, and mutations to its own
        // content.
        // 
        // As such the shallow history does not hold reference elements, and does not propagate
        // traversals or `push`es.
        this.shallow = state.isShallow();

        // A host state that bears the `immutable` attribute asserts that all of its descendant
        // states will also be immutable; consequently the history does not need to record
        // mutations or implement the structures and logic required to traverse the recorded
        // mutations.
        // 
        // Absent that guarantee of absolute immutability, mutations will be stored within
        // `this.history` as deltas relative to the present expression of `this.state`. Traversal
        // operations will update these deltas as necessary to reflect the movement of the
        // `historyIndex` pointer.
        if ( !( this.stateIsImmutable = state.isImmutable() ) ) {

            // For faster traversals amidst mutations, `this.stateIndices` holds an array
            // containing the specific indices within `this.history` that point to states. A
            // `stateIndicesIndex` property is added as well, such that, for `history.length > 0`,
            // `this.stateIndices[ this.stateIndicesIndex ]` is equal to `this.historyIndex`.
            this.stateIndices = [];
            this.stateIndicesIndex = undefined;

            // A sequence of mutations is stored as a subarray of interstitial deltas between
            // adjacent state elements. The history’s current state, including mutations undergone
            // since the transition into that state, is precisely defined in relation to
            // `this.historyIndex` by `this.mutationOffset`, which is a non-negative number of
            // deltas ahead of `this.historyIndex`.
            this.mutationOffset = 0;
        }
    }

    Z.assign( StateHistory.prototype, {

        // #### superhistory
        //
        superhistory: function () {
            var superstate = this.state.superstate();
            if ( superstate ) return superstate.historian();
        },

        // #### root
        //
        root: function () {
            var sh = this.superhistory();
            if ( sh ) return sh.root() || sh;
        },

        // #### createElement
        // 
        // type inferences of `item`:
        //   * `Number` : pointer to a history element in a superstate
        //   * `String` : state path
        //   * `Object` : mutation delta
        //   * `null`   : state is inactive
        createElement: function ( item ) {
            this.elements[ guid += 1 ] = item;
        },
        
        // #### indexOf
        //
        // Returns the index of the item within `this.history` that holds the `key` for a
        // particular member of `this.elements`.
        indexOf: ( function () {
            function search ( sortedArray, key, min, max ) {
                var i, k;
                min || ( min = 0 );
                max || ( max = sortedArray.length - 1 );
                while ( min <= max ) {
                    i = ( min + max ) / 2 << 0;
                    k = sortedArray[i];
                    if      ( key < k ) max = i - 1;
                    else if ( key > k ) min = i + 1;
                    else    return i;
                }
            }
            return function ( key ) {
                return search( this.history, key );
            };
        })(),

        // #### traverse
        // 
        // Traverses the history per state, applying any interstitial mutations along the way.
        traverse: function (
             /*Number*/ states,
             /*Number*/ mutations, // = 0
            /*Boolean*/ directly   // = true
        ) {
            typeof mutations === 'boolean' && ( directly = mutations, mutations = 0 );
            mutations == null && ( mutations = 0 );

            var elements, history, historyIndex, historyLength,
            _;
            
        },

        old_traverse: function (
             /*Number*/ states,
             /*Number*/ mutations, // = 0
            /*Boolean*/ directly   // = true
        ) {
            var elements, history, historyIndex, historyLength,
                stateIndices, stateIndicesLength, stateIndicesIndex, mutationOffset,
                targetStateIndicesIndex, targetHistoryIndex,
                step, expr, blockLength, i, delta, deltaSum;

            elements = this.elements;
            history = this.history;
            historyIndex = this.historyIndex;
            if ( historyIndex === undefined ) return;
            historyLength = history.length;

            directly === undefined && ( directly = true );

            // If the host state and all of its descendants are immutable, then it is guaranteed
            // that no mutations will be stored in `history`. This means all of its elements will
            // refer to states, so traversal operations can simply proceed per-element.
            if ( this.stateIsImmutable ) {
                
                // Clamp `n` and acquire a `targetHistoryIndex`.
                targetHistoryIndex = historyIndex + n;
                    if ( targetHistoryIndex >= historyLength ) {
                        targetHistoryIndex = historyLength - 1;
                    } else if ( targetHistoryIndex < 0 ) {
                        targetHistoryIndex = 0;
                    }
                n = targetHistoryIndex - historyIndex;
                step = n < 0 ? -1 : 1;
                
                // `directly` causes the traversal to jump straight to the targeted state and
                // instigate a single transition; otherwise the traversal transitions through
                // each state in order.
                if ( directly ) {
                    this.historyIndex = targetHistoryIndex;
                    this.changeState( history[ targetHistoryIndex ] );
                } else {
                    while ( historyIndex !== targetHistoryIndex ) {
                        this.historyIndex = historyIndex += step;
                        this.changeState( history[ historyIndex ] );
                    }
                }
            }
            
            // Otherwise, since the host state or any of its descendants could be mutable, the
            // possibility exists of mutations being stored in this history, in which case the
            // traversal will involve applying these mutations to the host state and transforming
            // the mutation deltas appropriately.
            else {
                // Clamp `n` and acquire a `targetHistoryIndex`.
                stateIndices             = this.stateIndices;
                stateIndicesLength       = stateIndices.length;
                stateIndicesIndex        = this.stateIndicesIndex;
                mutationOffset           = this.mutationOffset;
                targetStateIndicesIndex  = stateIndicesIndex + n;
                    if ( targetStateIndicesIndex >= stateIndicesLength ) {
                        targetStateIndicesIndex = stateIndicesLength - 1;
                    } else if ( targetStateIndicesIndex < 0 ) {
                        targetStateIndicesIndex = 0;
                    }
                targetHistoryIndex       = stateIndices[ targetStateIndicesIndex ];
                n                        = targetStateIndicesIndex - stateIndicesIndex;
                step                     = n < 0 ? -1 : 1;

                // Get a plain-object expression of this history’s state to apply deltas against.
                expr = this.state.express();

                // Process the elements of `history` in blocks, each consisting of one state
                // element at the tail, followed by a contiguous sequence of zero or more
                // mutations.
                while ( historyIndex !== targetHistoryIndex ) {

                    // `blockLength` refers to the number of mutations in this block; it does not
                    // account for the trailing state element (thus its range is `[0..]`).
                    blockLength = stateIndices[ stateIndicesIndex + 1 ] - historyIndex - 1;

                    // `mutationOffset` (which on the first run of the outer loop will already
                    // have been initialized to `this.mutationOffset`) iterates either backward
                    // or forward through the mutations in this block, accreting an aggregate
                    // delta, which, immediately prior to the next state change, will be applied
                    // to the state in a single mutation operation.
                    if ( step < 0 ) {
                        mutationOffset || ( mutationOffset = blockLength );
                    } else {
                        mutationOffset += 1;
                    }
                    while ( 0 < mutationOffset && mutationOffset <= blockLength ) {
                        i = historyIndex + mutationOffset;
                        delta = history[i];
                        history[i] = Z.delta( expr, delta );
                        deltaSum = Z.clone( deltaSum, delta );
                        mutationOffset += step;
                    }
                    mutationOffset = 0;

                    historyIndex = stateIndices[ stateIndicesIndex += step ];

                    // If instigating transitions on each iteration, then the transition for the
                    // next iteration’s block is made at the end of this iteration.
                    if ( !directly ) {
                        if ( deltaSum ) {
                            this.mutateState( deltaSum );
                            deltaSum = null;
                        }
                        this.historyIndex = historyIndex;
                        this.changeState( history[ historyIndex ] );
                    }
                }

                if ( directly ) {
                    deltaSum && this.mutateState( deltaSum );
                    this.changeState( history[ targetHistoryIndex ] );
                }

                this.mutationOffset = 0;
            }
        },

        changeState: function ( target ) {
            var result;
            this.traverse = Z.noop;
            result = this.state.change( target );
            delete this.traverse;
            return result;
        },

        mutateState: function ( expr ) {
            this.state.mutate( expr );
        },

        pushState: function ( state ) {
            var elements = this.elements,
                history = this.history,
                index = this.historyIndex + this.mutationOffset + 1;

            // Splice off the forward elements.
            history.splice( index, history.length - index );

            // Add `state` to the new end of `history`.
            this.historyIndex = index;
            this.mutationOffset = 0;
            state instanceof State || ( state = this.state.query( state ) );
            history[ index ] = state.toString();
        },

        replaceState: function ( state ) {
            var history = this.history,
                index = this.historyIndex
            // 
        },

        pushMutation: function ( mutation ) {

        },

        replaceMutation: function ( mutation ) {

        },

        previousStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndicesIndex - 1 ] :
                this.historyIndex - 1;
        },

        nextStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndicesIndex + 1 ] :
                this.historyIndex + 1;
        },

        currentState: function () {
            var selector = this.history[ this.historyIndex ];
            return this.state.query( selector ) || selector;
        },

        previousState: function () {
            var selector = this.history[ this.previousStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        nextState: function () {
            var selector = this.history[ this.nextStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        destroy: function () {
            this.state = this.history = null;
        }
    });

    return StateHistory;
})();