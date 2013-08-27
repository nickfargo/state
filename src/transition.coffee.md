    State = require './state'

    module.exports =



## [Transition](#transition)

A `Transition` is a transient `State` which acts as a “vehicle” for the
`RootState`’s currency, carrying it from one proper `State` to another.

When a transition is instigated, e.g. with a call to `State::change`, the
`RootState` sets its `_current` reference to a new `Transition`, which then
traverses the state tree from its `origin` to its `target`, adopting each
`State` along the way as its `superstate`.

If a transition includes an `action` function, this will be invoked when the
`Transition` has ascended to the top of its *domain*, defined as the least
common ancestor `State` between its `origin` and `target` states. The `action`
may be asynchronous, during which time the `Transition` continues to behave as
if it were a substate of the domain, inheriting method calls and propagating
events in the familiar fashion, until the `action` is concluded, upon which the
`Transition` resumes its descent to its `target`.

> [Transitions](/docs/#concepts--transitions)
> [Transition](/api/#transition)
> [`RootState::change`](/source/root-state.html#root-state--prototype--change)

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

        @_ = new @Metaobject

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
