## [Transition](#transition)

A `Transition` is a transient `State` adopted by the `RootState` while it
changes currency from one of its proper `State`s to another.

A transition may invoke an `action` within the **domain** of the least common
ancestor between its `origin` and `target` states. During this time it behaves
as if it were a substate of that domain state, inheriting method calls and
propagating events in the familiar fashion.

> [Transitions](/docs/#concepts--transitions)
> [Transition](/api/#transition)

    class Transition extends State

      { VIA_PROTO } = this


### [Constructor](#transition--constructor)

      constructor: ( target, source, expression, callback ) ->
        @name = expression.name or null

Unlike a proper `State`, a transition’s `superstate` is inherently dynamic, as
it tracks the transition’s progression as it traverses from `source` through
the domain and on to `target`.

        @superstate = source

        root = source.root
        throw ReferenceError unless target.root is root
        @root = root

        @owner = root.owner

        @target = target
        @source = source
        @origin = if source instanceof Transition
        then source.origin
        else source

        @callback = callback

The `action`, if provided, is responsible for calling `end`, either in the same
turn to complete a synchronous transition, or at some point in the future for
an asynchronous transition.

        @action = expression.action or null

        @_ = new @Content

        @aborted = no

        @initialize expression



### [Methods](#transition--methods)


#### [start](#transition--prototype--start)

      start: ->
        @aborted = no
        @emit 'start', arguments, VIA_PROTO
        if action = @action then action.apply this, arguments; this
        else @end.apply this, arguments


#### [abort](#transition--prototype--abort)

Indicates that `this` transition will not reach its `target`. Currency may be
delegated to a new `Transition`, in which case `this` will be retained as the
`source` of the new transition.

      abort: ->
        @aborted = yes
        @callback = null
        @emit 'abort', arguments, VIA_PROTO
        this


#### [end](#transition--prototype--end)

Indicates that `this` transition has completed and has reached its intended
`target`. The transition is retired by its `root`, and any preceding aborted
transitions along the `source` chain are discarded as well.

      end: ->
        unless @aborted
          @emit 'end', arguments, VIA_PROTO
          @callback?.apply @root, arguments
        do @destroy
        @target


#### [destroy](#transition--prototype--destroy)

      destroy: ->
        do @source.destroy if @source instanceof Transition
        @target = @superstate = @root = null


      emit: ( type ) ->
        if 1 or type is 'enter' or type is 'exit'
          debug "Transition::emit #{type}"
          debug "  superstate: #{ @superstate }"
        super
