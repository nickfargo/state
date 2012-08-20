// ## [Transition](#transition)
// 
// A `Transition` is a transient `State` adopted by a controller as it changes
// from one of its proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor*
// between its **origin** and **target** states. During this time it behaves as
// if it were a substate of that domain state, inheriting method calls and
// propagating events in the familiar fashion.
//
// > [Transitions](/docs/#concepts--transitions)
// > [Transition](/api/#transition)
var Transition = ( function () {
    O.inherit( Transition, State );

    // ### [Constructor](#transition--constructor)
    function Transition ( target, source, expression, callback ) {
        if ( !( this instanceof Transition ) ) {
            return TransitionExpression.apply( this, arguments );
        }

        var self = this,
            methods = {},
            events = {},
            guards = {},

            // The **action** of a transition is a function that will be called
            // after the transition has been `start`ed. This function, if
            // provided, is responsible for calling `end()` on the transition
            // at some point in the future.
            action = expression.action,

            attachment = source,
            controller, aborted;

        controller = source.controller();
        if ( controller !== target.controller() ) {
            controller = undefined;
        }

        // (Exposed for debugging.)
        O.env.debug && O.assign( this.__private__ = {}, {
            methods: methods,
            events: events,
            guards: guards,
            action: action
        });

        O.assign( this, {
            // #### [superstate](#transition--constructor--superstate)
            // 
            // A [`Transition`](#transition) instance uses `superstate` to
            // track its position as it traverses the [`State`](#state) subtree
            // that defines its domain.
            //
            // > [superstate](/api/#transition--methods--superstate)
            superstate: function () { return attachment; },

            // #### [attachTo](#transition--constructor--attach-to)
            attachTo: function ( state ) { return attachment = state; },

            // #### [controller](#transition--constructor--controller)
            controller: function () { return controller; },

            // #### [origin](#transition--constructor--origin)
            // 
            // A transition’s **origin** is the controller’s most recently
            // active [`State`](#state) that is not itself a
            // [`Transition`](#transition).
            //
            // > [origin](/api/#transition--methods--origin)
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // #### [source](#transition--constructor--source)
            // 
            // A transition’s **source** is the [`State`](#state) or
            // [`Transition`](#transition) that immediately preceded `this`.
            //
            // > [source](/api/#transition--methods--source)
            source: function () { return source; },

            // #### [target](#transition--constructor--target)
            // 
            // The intended destination [`State`](#state) for this transition.
            // If a target is invalidated by a controller that
            // [`change`](#state-controller--privileged--change)s state again
            // before this transition completes, then this transition is
            // aborted and the `change` call will create a new transition with
            // `this` as its `source`.
            //
            // > [target](/api/#transition--methods--target)
            target: function () { return target; },

            // #### [setCallback](#transition--constructor--set-callback)
            // 
            // Allows the callback function to be set or changed prior to the
            // transition’s completion.
            setCallback: function ( fn ) { return callback = fn; },

            // #### [wasAborted](#transition--constructor--was-aborted)
            //
            // > [wasAborted](/api/#transition--methods--was-aborted)
            wasAborted: function () { return aborted; },

            // #### [start](#transition--constructor--start)
            // 
            // Starts the transition; if an `action` is defined, that function
            // is responsible for declaring an end to the transition by calling
            // [`end()`](#transitions--constructor--end). Otherwise, the
            // transition is necessarily synchronous and is concluded
            // immediately.
            //
            // > [start](/api/#transition--methods--start)
            start: function () {
                aborted = false;
                this.emit( 'start', arguments, false );
                if ( action && O.isFunction( action ) ) {
                    action.apply( this, arguments );
                    return this;
                } else {
                    return this.end.apply( this, arguments );
                }
            },

            // #### [abort](#transition--constructor--abort)
            // 
            // Indicates that a transition won’t directly reach its target
            // state; for example, if a new transition is initiated while an
            // asynchronous transition is already underway, that previous
            // transition is aborted. The previous transition is retained as
            // the `source` for the new transition.
            abort: function () {
                aborted = true;
                callback = null;
                this.emit( 'abort', arguments, false );
                return this;
            },

            // #### [end](#transition--constructor--end)
            // 
            // Indicates that a transition has completed and has reached its
            // intended target. The transition is subsequently retired, along
            // with any preceding aborted transitions.
            //
            // > [end](/api/#transition--methods--end)
            end: function () {
                if ( !aborted ) {
                    this.emit( 'end', arguments, false );
                    callback && callback.apply( controller, arguments );
                }
                this.destroy();
                return target;
            },

            // #### [destroy](#transition--constructor--destroy)
            // 
            // Destroys this transition and clears its held references, and
            // does the same for any aborted `source` transitions that preceded
            // it.
            destroy: function () {
                source instanceof Transition && source.destroy();
                target = attachment = controller = null;
            }
        });

        // [`Transition`](#transition) also inherits certain privileged methods
        // from [`State`](#state), which it obtains by partially applying the
        // corresponding members of [`State.privileged`](#state--privileged).
        O.privilege( this, State.privileged, {
            'express mutate' : [ TransitionExpression, undefined, null,
                methods, events, guards ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        O.alias( this, {
            addEvent: 'on bind',
            removeEvent: 'off unbind',
            emit: 'trigger'
        });

        State.privileged.init( TransitionExpression ).call( this, expression );
    }

    // #### [depth](#transition--prototype--depth)
    // 
    Transition.prototype.depth = function () {
        var s = this.source(),
            count = 0;
        
        while ( s instanceof Transition ) {
            count++;
            s = s.source();
        }

        return count;
    };

    return Transition;
}() );