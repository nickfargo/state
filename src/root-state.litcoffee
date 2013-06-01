## [RootState](#root-state)

    class RootState extends State

      { VIRTUAL, ABSTRACT, CONCLUSIVE, FINAL } = this
      { VIA_NONE, VIA_PROTO } = this

      DEFAULT_OPTIONS = {}


### [Constructor](#root-state--constructor)

      constructor: ( owner, expression, options ) ->
        @owner = owner or = {}
        unless expression instanceof StateExpression
          expression = new StateExpression expression
        if options?
        then if typeof options is 'string' then options = initialState: options
        else options = DEFAULT_OPTIONS

Assign to `owner` an **accessor** to its state implementation.

        @accessorName = accessorName = options.name or 'state'
        owner[ accessorName ] = createAccessor owner, accessorName, this

A root state’s `name` is by definition the empty-string.

        super owner, @name = '', expression

Determine the initial state, and set the `current` state to that.

        current = if options.initialState?
        then this.query options.initialState
        else this.initialSubstate() or this

The initial state may be `abstract`, in which case currency must be forwarded
to its default `concrete` substate.

        if current.attributes & ABSTRACT
          current = current.defaultSubstate() or current

The previous redirections may have left `current` pointing to a protostate, in
which case a virtual state must be created in `this` root’s tree.

        if current.root isnt this then current = current.virtualize this

The authoritative property reference to the owner’s `current` state.

        @_current = current

While a `Transition` is underway, `_current` will be a reference to that
transition. To further distinguish this condition, an identical reference is
also held at `_transition`.

        @_transition = null



### [Private functions](#root-state--private)


#### [createAccessor](#root-state--private--create-accessor)

Returns the `accessor` function that will serve as an owner object’s interface
to its state implementation.

      createAccessor = ( owner, name, root ) ->

        accessor = ( input, args... ) ->
          current = root._current

          if this is owner
            return current unless input?
            return current.change input.call this if typeof input is 'function'
            if typeof input is 'string' and
                ( match = input.match rxTransitionArrow ) and
                  method = transitionArrowMethods[ match[1] ]
              return if args.length
              then current[ method ].apply current, [ match[2] ].concat args
              else current[ method ] match[2]
            return current.query.apply current, arguments

Calling the accessor of a prototype means that `this` requires its own accessor
and root state. Creating a new `RootState` will have the desired side-effect of
also creating the object’s new accessor, to which the call is then forwarded.

          else if owner.isPrototypeOf(this) and not O.hasOwn.call this, name
            new RootState this, null, { name, initialState: current.path() }
            return @[ name ].apply this, arguments

        accessor.isAccessor = true

        if O.env.debug
          accessor.toString = ->
            "[accessor] -> #{ root._current.path() }"

        accessor


#### [evaluateGuard](#root-state--private--evaluate-guard)

Returns the boolean result of a `guard` function in the `context` of a `State`,
as evaluated `against` another `State`. Defaults to `true` if no guard exists.

      evaluateGuard = ( context, guard, against ) ->
        guard = context.guard guard if typeof guard is 'string'
        return true unless guard

        args = O.slice.call arguments, 1
        for own key, value of guard
          valueIsFn = typeof value is 'function'
          selectors = O.trim( key ).split /\s*,+\s*/
          for selector in selectors when context.query selector, against
            result = if valueIsFn then value.apply context, args else value
            break
          break unless result
        !!result



### [Class methods](#root-state--class-methods)


#### [getTransitionExpression](#root-state--private--get-transition-expression)

Finds the appropriate transition expression for the given `target` and `origin`
states. If no matching transitions are defined in either state or any of their
ancestors, a generic actionless transition expression for the pair is returned.

      getTransitionExpression: do ->

        search = ( target, origin, subject, ceiling ) ->
          while subject and subject isnt ceiling
            for own key, expr of subject.transitions()
              return expr if (
                not ( guards = expr.guards ) or (
                  not ( admit = guards.admit ) or
                  O.isEmpty( admit ) or
                  evaluateGuard.call origin, admit, target, origin
                ) and (
                  not ( release = guards.release ) or
                  O.isEmpty( release ) or
                  evaluateGuard.call target, release, origin, target
                )
              ) and (
                if expr.target then subject.query expr.target, target
                else subject is target
              ) and ( not expr.origin or subject.query expr.origin, origin )
            break unless ceiling?
            subject = subject.superstate

        ( target, origin = @_current ) ->
          ( search target, origin, target ) or
          ( search target, origin, origin unless origin is target ) or
          ( search target, origin, target.superstate, @root ) or
          ( search target, origin, @root ) or
          ( unless target.isIn origin
            search target, origin, origin.superstate, origin.common target ) or
          new TransitionExpression



### [Prototype methods](#root-state--prototype-methods)


#### [change](#root-state--prototype--change)

Attempts to execute a state transition. Handles asynchronous transitions,
generation of appropriate events, and construction of any necessary temporary
virtual states. Respects guards supplied in both the origin and `target`
states.

The `target` parameter may be either a `State` object within the tree of this
`RootState`, or a string that resolves to a likewise targetable `State` when
evaluated from the context of the most recently current state.

The `options` parameter is an optional map that may include:

  * `args` : `Array` — arguments to be passed to a transition’s `action`.
  * `success` : `Function` — callback to be executed upon successful completion
    of the transition.
  * `failure` : `Function` — callback to be executed if the transition
    attempt is blocked by a guard.

      change: ( target, options ) ->
        { root, owner } = this
        current = @_current
        transition = @_transition

The `origin` is defined as the controller’s most recently current state that is
not a `Transition`.

        origin = transition?.origin or current

Departures are not allowed from a state that is `final`.

        return null if origin.attributes & FINAL

Ensure that `target` is a valid `State`.

        unless target instanceof State
          target = if target then origin.query target else root
        return null unless target
        targetOwner = target.owner
        return null if owner isnt targetOwner and
          not targetOwner.isPrototypeOf owner

Resolve `options` to an object if necessary.

        unless options then options = DEFAULT_OPTIONS
        else if O.isArray options then options = args: options
        { args } = options

A transition cannot target an abstract state directly, so `target` must be
reassigned to the appropriate concrete substate.

        while target.attributes & ABSTRACT
          return null unless target = target.defaultSubstate()

If any guards are in place for the given `origin` and `target`, both of those
states must consent to the transition.

        unless options.forced
          released = evaluateGuard origin, 'release', target
          admitted = evaluateGuard target, 'admit', origin
          unless released and admitted
            options.failure?.call? this
            return null

If `target` is a protostate, then the protostate must be virtualized locally
and `target` must be reassigned to the new virtual state.

        target = target.virtualize this unless target?.root is root

A reference is held to the previously current state, or abortive transition.

        source = current

The upcoming transition will start from its `source` and proceed within the
`domain` of the least common ancestor between `source` and `target`.

        domain = source.common target

Conclusivity is enforced by checking each state that will be exited against the
`conclusive` attributes.

        s = source; until s is domain
          return null if s.attributes & CONCLUSIVE
          s = s.superstate

If a previously initiated transition is still underway, it needs to be notified
that it will not finish.

        transition?.abort()

Retrieve the appropriate transition expression for this origin/target pairing.
If none is defined, then an actionless default transition will be created and
applied, causing the callback to return immediately.

        @_transition = transition = new Transition target, source,
          @getTransitionExpression target, origin

Preparation for the transition begins by emitting a `depart` event on the
`source` state.

        eventArgs = [ transition, args ]
        source.emit 'depart', eventArgs, VIA_PROTO
        @_transition = transition = null if transition.aborted

Enter into the transition state.

        if transition
          @_current = transition
          transition.emit 'enter', VIA_NONE
          @_transition = transition = null if transition.aborted

Walk up to the top of the domain, emitting `exit` events for each state along
the way.

        s = source; while transition and s isnt domain
          s.emit 'exit', eventArgs, VIA_PROTO
          transition.superstate = s = s.superstate
          @_transition = transition = null if transition.aborted

A callback will be invoked from `transition.end()` to conclude the transition.

        transition?.callback = ->
          transition = null if transition.aborted

Trace a path from `target` up to `domain`, then walk down it, emitting `enter`
events for each state along the way.

          if transition
            s = target; pathToState = []; while s isnt domain
              pathToState.push s
              s = s.superstate
          s = domain; while transition and substate = pathToState.pop()
            transition.superstate = substate
            substate.emit 'enter', eventArgs, VIA_PROTO
            transition = null if transition.aborted
            s = substate

Exit from the transition state.

          if transition
            transition.emit 'exit', VIA_NONE
            transition = null if transition.aborted

Terminate the transition with an `arrive` event on the targeted state.

          if transition
            @_current = target
            target.emit 'arrive', eventArgs, VIA_PROTO

Any virtual states that were previously active may now be discarded.

            s = origin; while s.attributes & VIRTUAL
              ss = s.superstate
              do s.destroy
              s = ss

Now complete, the `Transition` instance can be discarded.

            do transition.destroy
            @_transition = transition = null

            options.success?.call? this

            return target

          return null

At this point the transition is attached to the `domain` state and is ready to
proceed.

        return transition?.start.apply( transition, args ) or @_current
