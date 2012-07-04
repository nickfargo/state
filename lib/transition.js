// <a class="icon-link"
//    name="transition"
//    href="#transition"></a>
// 
// ## Transition
// 
// A `Transition` is a transient `State` adopted by a controller as it changes
// from one of its proper `State`s to another.
// 
// A transition acts within the **domain** of the *least common ancestor*
// between its **origin** and **target** states. During this time it behaves as
// if it were a substate of that domain state, inheriting method calls and
// propagating events in the familiar fashion.

var Transition = ( function () {
    Z.inherit( Transition, State );

    // <a class="icon-link"
    //    name="transition--constructor"
    //    href="#transition--constructor"></a>
    // 
    // ### Constructor
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
        Z.env.debug && Z.assign( this.__private__ = {}, {
            methods: methods,
            events: events,
            guards: guards,
            action: action
        });

        Z.assign( this, {
            // <a class="icon-link"
            //    name="transition--constructor--superstate"
            //    href="#transition--constructor--superstate"></a>
            // 
            // #### superstate
            // 
            // A [`Transition`](#transition) instance uses `superstate` to
            // track its position as it traverses the [`State`](#state) subtree
            // that defines its domain.
            superstate: function () { return attachment; },

            // <a class="icon-link"
            //    name="transition--constructor--attach-to"
            //    href="#transition--constructor--attach-to"></a>
            // 
            // #### attachTo
            attachTo: function ( state ) { return attachment = state; },

            // <a class="icon-link"
            //    name="transition--constructor--controller"
            //    href="#transition--constructor--controller"></a>
            // 
            // #### controller
            controller: function () { return controller; },

            // <a class="icon-link"
            //    name="transition--constructor--origin"
            //    href="#transition--constructor--origin"></a>
            // 
            // #### origin
            // 
            // A transition’s **origin** is the controller’s most recently
            // active [`State`](#state) that is not itself a
            // [`Transition`](#transition).
            origin: function () {
                return source instanceof Transition ? source.origin() : source;
            },

            // <a class="icon-link"
            //    name="transition--constructor--source"
            //    href="#transition--constructor--source"></a>
            // 
            // #### source
            // 
            // A transition’s **source** is the [`State`](#state) or
            // [`Transition`](#transition) that immediately preceded `this`.
            source: function () { return source; },

            // <a class="icon-link"
            //    name="transition--constructor--target"
            //    href="#transition--constructor--target"></a>
            // 
            // #### target
            // 
            // The intended destination [`State`](#state) for this transition.
            // If a target is invalidated by a controller that
            // [`change`](#state-controller--privileged--change)s state again
            // before this transition completes, then this transition is
            // aborted and the `change` call will create a new transition with
            // `this` as its `source`.
            target: function () { return target; },

            // <a class="icon-link"
            //    name="transition--constructor--set-callback"
            //    href="#transition--constructor--set-callback"></a>
            // 
            // #### setCallback
            // 
            // Allows the callback function to be set or changed prior to the
            // transition’s completion.
            setCallback: function ( fn ) { return callback = fn; },

            // <a class="icon-link"
            //    name="transition--constructor--was-aborted"
            //    href="#transition--constructor--was-aborted"></a>
            // 
            // #### wasAborted
            wasAborted: function () { return aborted; },

            // <a class="icon-link"
            //    name="transition--constructor--start"
            //    href="#transition--constructor--start"></a>
            // 
            // #### start
            // 
            // Starts the transition; if an `action` is defined, that function
            // is responsible for declaring an end to the transition by calling
            // [`end()`](#transitions--constructor--end). Otherwise, the
            // transition is necessarily synchronous and is concluded
            // immediately.
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

            // <a class="icon-link"
            //    name="transition--constructor--abort"
            //    href="#transition--constructor--abort"></a>
            // 
            // #### abort
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

            // <a class="icon-link"
            //    name="transition--constructor--end"
            //    href="#transition--constructor--end"></a>
            // 
            // #### end
            // 
            // Indicates that a transition has completed and has reached its
            // intended target. The transition is subsequently retired, along
            // with any preceding aborted transitions.
            end: function () {
                if ( !aborted ) {
                    this.emit( 'end', arguments, false );
                    callback && callback.apply( controller, arguments );
                }
                this.destroy();
                return target;
            },

            // <a class="icon-link"
            //    name="transition--constructor--destroy"
            //    href="#transition--constructor--destroy"></a>
            // 
            // #### destroy
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
        Z.privilege( this, State.privileged, {
            'express mutate' : [ TransitionExpression, undefined, null,
                methods, events, guards ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ]
        });
        Z.alias( this, {
            addEvent: 'on bind',
            removeEvent: 'off unbind',
            emit: 'trigger'
        });

        State.privileged.init( TransitionExpression ).call( this, expression );
    }

    // <a class="icon-link"
    //    name="transition--prototype--depth"
    //    href="#transition--prototype--depth"></a>
    // 
    // #### depth
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