// <a class="icon-link"
//    name="state--concurrency.js"
//    href="#state--concurrency.js"></a>
// 
// ### `state/concurrency.js`

O.assign( State.prototype, {
    
    // <a class="icon-link"
    //    name="state--prototype--region"
    //    href="#state--prototype--region"></a>
    // 
    // #### region
    //
    // Returns the root of the subtree that defines the concurrent orthogonal
    // region to which this state belongs. If no concurrency exists, this is
    // equivalent to calling [`root`](#state--prototype--root).
    region: function () {
        var s, ss;
        for ( s = this; ss = s.superstate(); s = ss ) {
            if ( ss.isConcurrent() ) break;
        }
        return s;
    },

    // <a class="icon-link"
    //    name="state--prototype--is-coregional-with"
    //    href="#state--prototype--is-coregional-with"></a>
    // 
    // #### isCoregionalWith
    //
    // Predicate that determines whether `this` and `state` exist within a
    // common orthogonal region. A transition may only traverse between states
    // that are coregional.
    isCoregionalWith: function ( state ) {
        state instanceof State || ( state = this.query( state ) );
        return this.region() === state.region();
    },

    // #### join
    //
    // Instigates a transition from the local region’s 
    join: function () {
        
    }
});
