// ## History
// 
// ' * ' : the precise location within the `history` array that describes the
//         present condition and composition of `this.state`
// 'Sta' : any string that names a state
// 'Mut' : any delta object that describes a mutation
// 'NIL' : the value `Z.NIL`
// '~==' : "is essentially deep-equal to"
// '<ƒ>' : an arbitrary function
// 
//                                                     7         *    11
// history            : [ Sta Sta Mut Sta Mut Mut Sta Sta Mut Mut Mut Sta Mut Sta ]
// historyIndex       : 7
// stateIndices       : [ 0  1  3  6  7  11  12  14 ]
// stateIndicesIndex  : 4
// mutationOffset     : 2
//
//           7                                           *                   11
// [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:3} }, 'StateB' ... ]
// 
// this.state.express() ~== state( 'mutable history', {
//                              data: { a:1 },
//                              methods: { b:<ƒ> },
//                              states: {
//                                  StateA: {},
//                                  StateB: {}
//                              }
//                          })
// 
// 
// > this.mutate( 1 );
// mutationOffset     : 3
// 
//           7                                                             *   11
// [ ... 'StateA', { data:{a:NIL} }, { methods:{b:NIL} }, { data:{c:NIL} }, 'StateB' ... ]
// 
// this.state.express() ~== state( ...
//                              data: { a:1, c:3 },
//                              methods: { b:<ƒ> }
//                          ... )
// 
// 
// > this.mutate( -2 );
// mutationOffset     : 1
// 
//           7                      *                                        11
// [ ... 'StateA', { data:{a:NIL} }, { methods:{b:<ƒ>} }, { data:{c:3} }, 'StateB' ... ]
// 
// this.state.express() ~== state( ...
//                              data: { a:1 },
//                              methods: {}
//                          ... )

var History = ( function () {

    function History ( /*State*/ state ) {
        var history;

        // The state to which this history belongs.
        this.state = state;

        // The state’s history is kept in an array whose elements are either states, recorded as
        // strings that identify a previously or subsequently current `State` within the domain of
        // `this.state`, or deltas, recorded as objects that contain the key-value changes between
        // adjacent mutations of `this.state`.
        history = this.history = [];

        // `this.historyIndex` points to a state (string) element within `this.history`, which
        // names the specific `State` that is presently **current** within the history.
        this.historyIndex = undefined;

        // Mutations are stored within `this.history` as deltas relative to an expression of
        // `this.state`, and are updated accordingly as traversal operations move `index` to a
        // different state in the history.
        if ( state.isMutable() ) {
            this.stateIsMutable = true;

            // For faster traversals amidst mutations, `this.stateIndices` holds an array
            // containing the specific indices within `this.history` that point to states. A
            // `stateIndicesIndex` property is added as well, such that for `history.length > 0`,
            // `this.stateIndices[ this.stateIndicesIndex ] === this.historyIndex` is invariant.
            this.stateIndices = [];
            this.stateIndicesIndex = undefined;

            // A sequence of mutations is stored as a subarray of interstitial deltas between
            // adjacent state elements. The history’s current state, including mutations undergone
            // since the transition into that state, is precisely defined by `this.mutationOffset`,
            // which is a non-negative number of deltas ahead of `this.historyIndex`.
            this.mutationOffset = 0;
        }
    }

    Z.assign( History.prototype, {

        // #### traverseStates
        // 
        // Traverses the history by state, applying any interstitial mutations along the way.
        traverseStates: function (
             /*Number*/ n,
            /*Boolean*/ directly  // = true
        ) {
            var history, historyIndex, historyLength,
                stateIndices, stateIndicesLength, stateIndicesIndex, mutationOffset,
                targetStateIndicesIndex, targetHistoryIndex,
                step, expr, blockLength, i, delta, deltaSum;

            history = this.history;
            historyIndex = this.historyIndex;
            if ( historyIndex === undefined ) return;
            historyLength = history.length;

            directly === undefined && ( directly = true );
            
            // If `this.state` or any of its descendants are mutable, then the possibility exists
            // of mutations being stored in this history, in which case the traversal will involve
            // applying these mutations to `this.state` and transforming them appropriately.
            if ( this.stateIsMutable ) {

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

                // Process elements of `history` as blocks consisting of one state element at the
                // tail, followed by a contiguous sequence of zero or more mutations.
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

            // All descendant states are immutable, so all elements of `history` refer to states,
            // and traversal can simply proceed per-element, without regard to mutation.
            else {
                // Clamp `n` and acquire a `targetHistoryIndex`.
                targetHistoryIndex  = historyIndex + n;
                    if ( targetHistoryIndex >= historyLength ) {
                        targetHistoryIndex = historyLength - 1;
                    } else if ( targetHistoryIndex < 0 ) {
                        targetHistoryIndex = 0;
                    }
                n                   = targetHistoryIndex - historyIndex;
                step                = n < 0 ? -1 : 1;
                
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
        },

        changeState: function ( target ) {
            var result;
            this.traverseStates = Z.noop;
            result = this.state.change( target );
            delete this.traverseStates;
            return result;
        },

        mutateState: function ( expr ) {
            this.state.mutate( expr );
        },

        pushState: function ( state ) {
            // splice off elements forward of index
        },

        replaceState: function ( state ) {

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

    return History;
})();