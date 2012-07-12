// ## StateHistory
// 
/*
    ### How `mutationOffset` works

    ' * ' : the precise location within the `history` array that describes the
            present condition and composition of `this.state`
    'Sta' : any string that names a state
    'Mut' : any delta object that describes a mutation
    'NIL' : the value `O.NIL`, representing a stored `delete` operation
    '~==' : "is essentially deep-equal to"
    '<ƒ>' : an arbitrary function
    
                                                        7         *    11
    indices            : [ Sta Sta Mut Sta Mut Mut Sta Sta Mut Mut Mut Sta Mut Sta ]
    index              : 7
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

    function binarySearch ( sortedArray, key, min, max ) {
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

    function StateHistory ( /*State*/ state ) {

        // The state to which this history belongs.
        this.state = state;

        // The history’s contents are stored as a “heap” of `elements`, whose
        // keys are unique decimal integers supplied by the up-scope `guid`,
        // which map to values that are either:
        // 
        // * a `String` that uniquely identifies a previously or subsequently
        //   current `State` within the domain of `this.state`;
        // 
        // * an `Object` that represents a **mutation delta**, which contains
        //   the key-value changes between adjacent mutations of `this.state`;
        // 
        // * a `Number` that is an **element reference** pointing to a
        //   superhistory element, within which is contained the information
        //   relevant to this element;
        // 
        // * or `null`, indicating a period of inactivity. Anytime the owner
        //   object `exit`s a `history` state, a `null` entry is recorded.
        this.elements = {};

        // The element references of `this.elements` are indexed in an ordered
        // list.
        this.indices = [];

        // `this.index` indirectly references, via `this.indices`, a state
        // (string) element within `this.elements` that names the specific
        // `State` that is presently **current** within the history.
        this.index = undefined;

        // By default a history is “deep”, in that it records a view into the
        // timeline of its client `state`, which includes the active condition
        // of and mutations to itself and all of its descendants. This is
        // contrasted with a `shallow` history, which only records the active
        // condition of the `state`’s immediate substates, and mutations to its
        // own content.
        // 
        // As such the shallow history does not hold reference elements, and
        // does not propagate traversals or `push`es.
        this.isShallow = state.isShallow();

        // A host state that bears the `immutable` attribute asserts that all
        // of its descendant states will also be immutable; consequently the
        // history does not need to record mutations or implement the
        // structures and logic required to traverse the recorded mutations.
        // 
        // Absent that guarantee of absolute immutability, mutations will be
        // stored within `this.indices` as deltas relative to the present
        // expression of `this.state`. Traversal operations will update these
        // deltas as necessary to reflect the movement of the `index` pointer.
        if ( !( this.stateIsImmutable = state.isImmutable() ) ) {

            // For faster traversals amidst mutations, `this.stateIndices`
            // holds an array containing the specific indices within
            // `this.indices` that point to states. A `stateIndex` property is
            // added as well, such that, for `this.indices.length > 0`,
            // `this.stateIndices[ this.stateIndex ]` is equal to `this.index`.
            this.stateIndices = [];
            this.stateIndex = undefined;

            // A sequence of mutations is stored as a subarray of interstitial
            // deltas between adjacent state elements. The history’s current
            // state, including mutations undergone since the transition into
            // that state, is precisely defined in relation to `this.index` by
            // `this.mutationOffset`, which is a non-negative number of deltas
            // ahead of `this.index`.
            this.mutationOffset = 0;
        }
    }

    O.assign( StateHistory.prototype, {

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
        // 
        // * `Number` : pointer to a superhistory element
        // * `String` : state path
        // * `Object` : mutation delta
        // * `null`   : state is inactive
        createElement: function ( item ) {
            this.elements[ guid += 1 ] = item;
        },
        
        // #### indexOf
        //
        // Returns the index of the item within `this.indices` that holds the
        // `key` for a particular member of `this.elements`.
        indexOf: function () {
            return function ( key ) {
                return binarySearch( this.indices, key );
            };
        },

        traverseToElement: function ( /*Number*/ key ) {
            var targetIndex = binarySearch( this.indices, key );
            if ( targetIndex ) return this.traverseToIndex( targetIndex );
        },

        traverseToIndex: function (
             /*Number*/ targetIndex,
            /*Boolean*/ directly      // = true
        ) {
            var indices = this.indices,
                index = this.index,
                step = targetIndex < index ? -1 : 1,
                stateIndices, stateIndex, targetStateIndex, offset, expr, nMutations,
                blockLength, i, delta, compoundDelta;

            // If the host state and all of its descendants are immutable, then
            // it is guaranteed that no mutations will be stored in `indices`.
            // This means all of its elements will refer to states, so
            // traversal operations can simply proceed per-element.
            if ( this.stateIsImmutable ) {

                // `directly` causes the traversal to jump straight to the
                // targeted state and instigate a single transition; otherwise
                // the traversal transitions through each state in order.
                if ( directly ) {
                    this.index = targetIndex;
                    this.changeState( indices[ targetIndex ] );
                } else {
                    while ( index !== targetIndex ) {
                        this.index = index += step;
                        this.changeState( indices[ index ] );
                    }
                }
            }

            // Otherwise, since the host state or any of its descendants could
            // be mutable, the possibility exists of mutations being stored in
            // this history, in which case the traversal will involve applying
            // these mutations to the host state and transforming the mutation
            // deltas appropriately.
            else {
                stateIndices      = this.stateIndices;
                stateIndex        = this.stateIndex;
                targetStateIndex; // = `stateIndex` that is or is to the left of `targetIndex`
                offset            = this.mutationOffset;

                // Get a plain-object expression of this history’s state to
                // apply deltas against.
                expr = this.state.express();

                // Process the elements of `indices` in blocks, each consisting
                // of one state element at the tail, followed by a contiguous
                // sequence of zero or more mutations.
                while ( index !== targetIndex ) {

                    // `blockLength` refers to the number of mutations in this
                    // block; it does not account for the trailing state
                    // element (thus its range is `[0..]`).
                    blockLength = stateIndices[ stateIndex + 1 ] - index - 1;

                    // `offset` (which on the first run of the outer loop will
                    // already have been initialized to `this.mutationOffset`)
                    // iterates either backward or forward through the
                    // mutations in this block, accreting an aggregate delta,
                    // which, immediately prior to the next state change, will
                    // be applied to the state in a single mutation operation.
                    if ( step < 0 ) {
                        offset || ( offset = blockLength );
                    } else {
                        offset += 1;
                    }

                    while ( 0 < offset && offset <= blockLength ) {
                        if ( index === targetIndex ) {
                            if ( nMutations === 0 ) break;
                            else nMutations--;
                        }
                        i = index + offset;
                        delta = indices[i];
                        indices[i] = O.delta( expr, delta );
                        compoundDelta = O.clone( compoundDelta, delta );
                        offset += step;
                    }
                    offset = 0;

                    index = stateIndices[ stateIndex += step ];

                    // If instigating transitions on each iteration, then the
                    // transition for the next iteration’s block is made at the
                    // end of this iteration.
                    if ( !directly ) {
                        if ( compoundDelta ) {
                            this.mutateState( compoundDelta );
                            compoundDelta = null;
                        }
                        this.index = index;
                        this.changeState( indices[ index ] );
                    }
                }

                if ( directly ) {
                    compoundDelta && this.mutateState( compoundDelta );
                    this.changeState( indices[ targetIndex ] );
                }

                this.mutationOffset = 0;
            }
        },

        // #### traverse
        // 
        // Traverses the history by a given number of states, applying any
        // interstitial mutations along the way, and by a given number of
        // additional mutations upon arrival at the targeted state.
        traverseBy: function (
             /*Number*/ nStates,
             /*Number*/ nMutations, // = 0
            /*Boolean*/ directly    // = true
        ) {
            var elements, indices, index, length,
                stateIndices, stateIndicesLength, stateIndex, mutationOffset,
                targetIndex, targetStateIndex,
                step, expr, blockLength, i, delta, compoundDelta;

            typeof nStates === 'string';
            if ( typeof nMutations === 'boolean' ) {
                directly = nMutations;
                nMutations = 0;
            }
            nMutations == null && ( nMutations = 0 );

            elements = this.elements;
            indices = this.indices;
            index = this.index;
            if ( index === undefined ) return;
            length = indices.length;

            directly === undefined && ( directly = true );

            // If the host state and all of its descendants are immutable, then
            // it is guaranteed that no mutations will be stored in `indices`.
            // This means all of its elements will refer to states, so
            // traversal operations can simply proceed per-element.
            if ( this.stateIsImmutable ) {
                
                // Clamp `nStates` and acquire a `targetIndex`.
                targetIndex = index + nStates;
                    if ( targetIndex >= length ) {
                        targetIndex = length - 1;
                    } else if ( targetIndex < 0 ) {
                        targetIndex = 0;
                    }
                nStates = targetIndex - index;
                step = nStates < 0 ? -1 : 1;
                
                // `directly` causes the traversal to jump straight to the
                // targeted state and instigate a single transition; otherwise
                // the traversal transitions through each state in order.
                if ( directly ) {
                    this.index = targetIndex;
                    this.changeState( indices[ targetIndex ] );
                } else {
                    while ( index !== targetIndex ) {
                        this.index = index += step;
                        this.changeState( indices[ index ] );
                    }
                }
            }
            
            // Otherwise, since the host state or any of its descendants could
            // be mutable, the possibility exists of mutations being stored in
            // this history, in which case the traversal will involve applying
            // these mutations to the host state and transforming the mutation
            // deltas appropriately.
            else {
                // Clamp `nStates` and acquire a `targetIndex`.
                stateIndices         = this.stateIndices;
                stateIndicesLength   = stateIndices.length;
                stateIndex           = this.stateIndex;
                mutationOffset       = this.mutationOffset;
                targetStateIndex     = stateIndex + nStates;
                    if ( targetStateIndex >= stateIndicesLength ) {
                        targetStateIndex = stateIndicesLength - 1;
                    } else if ( targetStateIndex < 0 ) {
                        targetStateIndex = 0;
                    }
                targetIndex          = stateIndices[ targetStateIndex ];
                nStates              = targetStateIndex - stateIndex;
                step                 = nStates < 0 ? -1 : 1;

                // Get a plain-object expression of this history’s state to
                // apply deltas against.
                expr = this.state.express();

                // Process the elements of `indices` in blocks, each consisting
                // of one state element at the tail, followed by a contiguous
                // sequence of zero or more mutations.
                while ( index !== targetIndex || nMutations ) {

                    // `blockLength` refers to the number of mutations in this
                    // block; it does not account for the trailing state
                    // element (thus its range is `[0..]`).
                    blockLength = stateIndices[ stateIndex + 1 ] - index - 1;

                    // `mutationOffset` (which on the first run of the outer
                    // loop will already have been initialized to
                    // `this.mutationOffset`) iterates either backward or
                    // forward through the mutations in this block, accreting
                    // an aggregate delta, which, immediately prior to the next
                    // state change, will be applied to the state in a single
                    // mutation operation.
                    if ( step < 0 ) {
                        mutationOffset || ( mutationOffset = blockLength );
                    } else {
                        mutationOffset += 1;
                    }
                    while ( 0 < mutationOffset && mutationOffset <= blockLength ) {
                        if ( index === targetIndex ) {
                            if ( nMutations === 0 ) break;
                            else nMutations--;
                        }
                        i = index + mutationOffset;
                        delta = indices[i];
                        indices[i] = O.delta( expr, delta );
                        compoundDelta = O.clone( compoundDelta, delta );
                        mutationOffset += step;
                    }
                    mutationOffset = 0;

                    index = stateIndices[ stateIndex += step ];

                    // If instigating transitions on each iteration, then the
                    // transition for the next iteration’s block is made at the
                    // end of this iteration.
                    if ( !directly ) {
                        if ( compoundDelta ) {
                            this.mutateState( compoundDelta );
                            compoundDelta = null;
                        }
                        this.index = index;
                        this.changeState( indices[ index ] );
                    }
                }

                if ( directly ) {
                    compoundDelta && this.mutateState( compoundDelta );
                    this.changeState( indices[ targetIndex ] );
                }

                this.mutationOffset = 0;
            }
        },

        changeState: function ( target ) {
            var result;
            this.traverse = O.noop;
            result = this.state.change( target );
            delete this.traverse;
            return result;
        },

        mutateState: function ( expr ) {
            this.state.mutate( expr );
        },

        pushState: function ( state ) {
            var elements = this.elements,
                indices = this.indices,
                index = this.index + this.mutationOffset + 1;

            // Splice off the forward elements.
            indices.splice( index, indices.length - index );

            // Add `state` to the new end of `indices`.
            this.index = index;
            this.mutationOffset = 0;
            state instanceof State || ( state = this.state.query( state ) );
            indices[ index ] = state.toString();
        },

        replaceState: function ( state ) {
            var indices = this.indices,
                index = this.index;
            // 
        },

        pushMutation: function ( mutation ) {

        },

        replaceMutation: function ( mutation ) {

        },

        previousStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndex - 1 ] :
                this.index - 1;
        },

        nextStateIndex: function () {
            return this.stateIndices ?
                this.stateIndices[ this.stateIndex + 1 ] :
                this.index + 1;
        },

        currentState: function () {
            var selector = this.indices[ this.index ];
            return this.state.query( selector ) || selector;
        },

        previousState: function () {
            var selector = this.indices[ this.previousStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        nextState: function () {
            var selector = this.indices[ this.nextStateIndex() ];
            return this.state.query( selector ) || selector;
        },

        destroy: function () {
            this.state = this.indices = null;
        }
    });

    return StateHistory;
}() );
