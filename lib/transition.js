// ## Transition <a name="transition" href="#transition">&#x1f517;</a>
// 
// A **transition** is a transient `State` adopted by a controller as it changes from one of its
// proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor* between its **origin**
// and **target** states. During this time it behaves as if it were a substate of that domain
// state, inheriting method calls and propagating events in the familiar fashion.

var Transition = ( function () {
    Z.inherit( Transition, State );

    // ### Constructor
    function Transition ( target, source, expression, callback ) {
        if ( !( this instanceof Transition ) ) {
            return TransitionExpression.apply( this, arguments );
        }
        
        var self = this,
            methods = {},
            events = {},
            guards = {},

            // The **action** of a transition is a function that will be called after the
            // transition has been `start`ed. This function, if provided, is responsible for
            // calling `end()` on the transition at some point in the future.
            action = expression.action,

            attachment = source,
            controller, aborted;
        
        controller = source.controller();
        if ( controller !== target.controller() ) {
            controller = undefined;
        }

        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this.__private__ = {}, {
            methods: methods,
            events: events,
            guards: guards,
            action: action
        });

        Z.assign( this, {
            // #### superstate
            // 
            // In a transition, `superstate` is used to track its position as it traverses the
            // `State` subtree that defines its domain.
            superstate: function () { return attachment; },

            // #### attachTo
            attachTo: function ( state ) { return attachment = state; },

            // #### controller
            controller: function () { return controller; },

            // #### origin
            // 
            // A transition's **origin** is the controller’s most recently active `State` that is
            // not itself a `Transition`.
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // #### source
            // 
            // A transition’s **source** is the `State` or `Transition` that immediately preceded
            // `this`.
            source: function () { return source; },

            // #### target
            // 
            // The intended destination `State` for this transition. If a target is invalidated by
            // a controller that `change`s state again before this transition completes, then this
            // transition is aborted and the `change` call will create a new transition that is
            // `source`d from `this`.
            target: function () { return target; },

            // #### setCallback
            // 
            // Allows the callback function to be set or changed prior to the transition’s
            // completion.
            setCallback: function ( fn ) { return callback = fn; },

            // #### aborted
            aborted: function () { return aborted; },
            
            // #### start
            // 
            // Starts the transition; if an `action` is defined, that function is responsible
            // for declaring an end to the transition by calling `end()`. Otherwise, the
            // transition is necessarily synchronous and is concluded immediately.
            start: function () {
                aborted = false;
                this.emit( 'start', arguments, false );
                if ( action && Z.isFunction( action ) ) {
                    action.apply( this, arguments );
                    return this;
                } else {
                    return this.end.apply( this, arguments );
                }
            },
            
            // #### abort
            // 
            // Indicates that a transition won’t directly reach its target state; for example, if a
            // new transition is initiated while an asynchronous transition is already underway,
            // that previous transition is aborted. The previous transition is retained as the
            // `source` for the new transition.
            abort: function () {
                aborted = true;
                callback = null;
                this.emit( 'abort', arguments, false );
                return this;
            },
            
            // #### end
            // 
            // Indicates that a transition has completed and has reached its intended target. The
            // transition is subsequently retired, along with any preceding aborted transitions.
            end: function () {
                if ( !aborted ) {
                    this.emit( 'end', arguments, false );
                    callback && callback.apply( controller, arguments );
                }
                this.destroy();
                return target;
            },
            
            // #### destroy
            // 
            // Destroys this transition and clears its held references, and does the same for any
            // aborted `source` transitions that preceded it.
            destroy: function () {
                source instanceof Transition && source.destroy();
                target = attachment = controller = null;
            }
        });
        Z.privilege( this, State.privileged, {
            'init mutate' : [ TransitionExpression ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );
        
        this.init( expression );
        expression = null;
    }

    Transition.prototype.depth = function () {
        var count = 0, transition = this, source;
        while ( ( source = transition.source() ) instanceof Transition ) {
            transition = source;
            count++;
        }
        return count;
    };
    
    return Transition;
})();