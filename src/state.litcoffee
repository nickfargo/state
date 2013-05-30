## [State](#state)

> [State](/api/#state)

    class State

      { memoizeProtostates, useDispatchTables } = state.options

Bit field constants will be used extensively throughout the class’s constructor
and methods, so make them available as free variables.

      {
        NORMAL
        INCIPIENT, ATOMIC, DESTROYED
        VIRTUAL
        MUTABLE, FINITE, STATIC, IMMUTABLE
        INITIAL, CONCLUSIVE, FINAL
        ABSTRACT, CONCRETE, DEFAULT
        REFLECTIVE
        HISTORY, RETAINED, SHALLOW
        CONCURRENT
      } =
          O.assign this, STATE_ATTRIBUTES

For methods that query related states, the default behavior is to recurse
through substates, superstates, and protostates.

      { VIA_NONE, VIA_SUB, VIA_SUPER, VIA_PROTO, VIA_ALL } =
          O.assign this, TRAVERSAL_FLAGS

Precompute certain useful attribute combinations.

      MUTABLE_OR_FINITE     = MUTABLE | FINITE
      ABSTRACT_OR_CONCRETE  = ABSTRACT | CONCRETE
      INCIPIENT_OR_VIRTUAL  = INCIPIENT | VIRTUAL
      INCIPIENT_OR_MUTABLE  = INCIPIENT | MUTABLE

A bit mask indicates the attributes that can be inherited via protostates.

      PROTO_HERITABLE_ATTRIBUTES =
        MUTABLE     |  FINITE      |  STATIC     |  IMMUTABLE  |
        INITIAL     |  CONCLUSIVE  |  FINAL      |
        ABSTRACT    |  CONCRETE    |  DEFAULT    |
        REFLECTIVE  |
        HISTORY     |  RETAINED    |  SHALLOW    |
        CONCURRENT




### [Supporting classes](#state--supporting-classes)

These are keyed here for shape order, and will be valued by the respective
constructors after they are created.

      Expression: null
      Content: null



### [Constructor](#state--constructor)

      constructor: ( base, @name, expression ) ->

The `base` argument can specify either a `superstate` from which to inherit,
or an `owner` for which to act as a new `root` state.

        if base instanceof State
          @superstate = superstate = base
          @root = root = superstate.root
          @owner = owner = root.owner
        else
          @superstate = superstate = null
          @root = root = this
          @owner = owner = base

###### Attribute inheritance masking

Explicitly defined *literal* attributes for `this` state are encoded as a bit
field integer within `expression`, and then superimposed atop the *inherited*
attribute values acquired from `this` state’s superstate and protostate.

        attributes = expression?.attributes or NORMAL

The `mutable` and `finite` attributes can be inherited from the superstate
straight away.

        if superstate
          superAttr = superstate.attributes
          attributes |= superAttr & MUTABLE_OR_FINITE

A subset of the attributes may be inherited from protostates.

        if protostate = @protostate()

          protoAttr = protostate.attributes & PROTO_HERITABLE_ATTRIBUTES

Literal `concrete` forcibly contradicts literal `abstract`; if a bad production
includes both attributes, negate `abstract`.

          attributes &= ~ABSTRACT if attributes & CONCRETE

Literal `abstract` may override inherited `concrete`, and vice versa, so filter
those attributes out of the protostate before inheriting.

          if attributes & ABSTRACT_OR_CONCRETE
            protoAttr &= ~ABSTRACT_OR_CONCRETE
          attributes |= protoAttr

If at this point the state is not `abstract`, then `concrete` must be imposed.

        attributes |= CONCRETE if ~attributes & ABSTRACT

Literal or inherited `immutable` contradicts `mutable` absolutely, and implies
`finite`.

        attributes |= ( superAttr | protoAttr ) & IMMUTABLE
        if attributes & IMMUTABLE
          attributes &= ~MUTABLE
          attributes |= FINITE

        @attributes = attributes

###### Offloaded initialization

        @initialize expression unless attributes & VIRTUAL


Additional property assignments for easy viewing in the inspector.

        if O.env.debug
          @[' <path>']       = @path()
          @['<attributes>']  = StateExpression.decodeAttributes attributes



### [Class-private](#state--private)


#### [createDispatcher](#state--private--create-dispatcher)

For each method defined in any of the owner’s states, a **dispatcher** must be
created and assigned on the owner itself at the `methodName` key. Calls to
`owner.methodName` are then delegated by the dispatcher to the owner’s current
state, from which the appropriate implementation for the method will be located
and applied, and its result returned back to the original caller.

When `addMethod` is called, if an identically named method is already present
on the owner, that function is added as a method of the owner’s root state. In
this way the owner’s original implementation remains accessible as the “default
behavior” should no current or active state contain an implementation for that
method.

Stateful methods are applied in the context of the `State` to which they
belong, or, if a method is inherited from a protostate, the context will be the
corresponding virtual state in the local state tree. For methods relocated to
the root state as described above, however, the context appropriately remains
bound to the owner object.

> [Dispatchers](/docs/#concepts--methods--dispatchers)

      createDispatcher = do ->
        toString = -> "[dispatcher]"
        ( accessorName, methodName, original ) ->
          dispatcher = -> @[ accessorName ]().apply methodName, arguments
          dispatcher.isDispatcher = yes
          dispatcher.toString = toString if O.env.debug
          dispatcher.original = original if original
          dispatcher



### [Ontological methods](#state--ontological-methods)


#### [initialize](#state--prototype--initialize)

Builds out the state’s members based on the expression provided.

> See also:
> `Constructor`

      initialize: ( expression ) ->
        { attributes } = this
        return if attributes & VIRTUAL

        @attributes |= INCIPIENT
        @realize expression
        @attributes &= ~INCIPIENT
        @emit 'construct', expression, VIA_PROTO
        this


#### [realize](#state--prototype--realize)

Transforms an incipient or virtual `State` into a real state.

Much of the initialization for `State` is offloaded from the constructor,
allowing for creation of lightweight virtual `State` instances that inherit all
of their functionality from protostates, but can also be converted at some
later time to a real `State` if necessary.

> See also:
> `initialize`
> `virtualize`

      realize: ( expression ) ->
        return this unless @attributes & INCIPIENT_OR_VIRTUAL
        @_ or = new @Content
        @mutate expression

Realizing a root state requires that, for each of the owner’s own methods, if
there exists at least one stateful implementation of that method located higher
in the owner’s prototype chain, then the owner’s implementation of that method
must be copied into the root, where it defines the owner’s default behavior.

        if this is @root
          for own key, method of @owner when typeof method is 'function' and
              not method.isDispatcher and @method key, VIA_PROTO
            @addMethod key, method

        this


#### [virtualize](#state--prototype--virtualize)

Creates, if necessary, a virtualized **epistate** of `this` protostate within
the state tree to which `inheritor` belongs, and also creates as many virtual
ancestor superstates as necessary to reach a real `State` within that tree.

Returns the state on `inheritor`’s state tree for which `this` is a protostate.
This will be the newly created virtual state, unless virtualization was
unnecessary, in which case it will be the extant real epistate of `this`.

> [Protostates](/docs/#concepts--inheritance--protostates)

      virtualize: ( inheritor ) ->

Verify that `inheritor`’s owner does indeed inherit from the owner of `this`.

        return null unless inheritor instanceof State and
          @owner.isPrototypeOf inheritor.owner

Get the `derivation` list for `this`.

        return null unless ( derivation = @derivation yes ).length

Traverse the real states of the inheriting state tree to their furthest depth.

        i = 0; s = inheritor.root
        while name = derivation[ i++ ]
          break unless real = s.substate name, VIA_NONE
          s = real

If `derivation` extends beyond the inheriting state tree’s real states, then
add virtual states to it until the whole superstate chain is represented.

        expr = attributes: VIRTUAL
        while name
          s = new State s, name, expr
          name = derivation[ i++ ]
        s


#### [destroy](#state--prototype--destroy)

Attempts to cleanly destroy this state and all of its substates. A `destroy`
event is issued to each state after it has been destroyed.

> [destroy (method)](/api/#state--methods--destroy)
> [destroy (event)](/api/#state--events--destroy)

      destroy: ->
        { owner, root, superstate, _ } = this
        { methods, events, substates } = _ if _

If a transition is underway that involves any state other than the root, then
the state cannot be destroyed.

        if transition = root._transition
          if this is root then do transition.abort
          else return no if ( transition.origin.isIn( this ) or
            transition.target.isIn( this ) )

Descendant states are destroyed bottom-up.

        do substate.destroy for own name, substate of substates

The final event emitted is `destroy`.

        @emit 'destroy', VIA_PROTO
        if events then for key, event of events
          do event.destroy
          delete events[ key ]

When the root state is destroyed, the owner gets back its original methods, and
the corresponding dispatcher for each such method is destroyed, along with the
owner’s accessor method.

        if this is root
          for name of methods when dispatcher = owner[ name ]
            continue unless dispatcher.isDispatcher
            if ownerMethod = dispatcher.original
            then owner[ name ] = ownerMethod
            else delete owner[ name ]
          delete owner[ @accessorName ]

A flag is set that can be observed later by anything retaining a reference to
this state (e.g. a memoization) which would be withholding it from being
garbage-collected.

        @attributes |= DESTROYED

A non-root state must remove itself from its superstate.

        superstate?.removeSubstate @name

        yes



### [Expression and mutation](#state--expression-and-mutation)


#### [express](#state--prototype--express)

Returns an **expression** of `this` state — a data structure that contains an
exported snapshot of the state’s own contents.

By default the returned expression is returned as a plain object; if `typed`
is truthy, the expression is a formally typed `StateExpression`.

      do =>
        { edit, clone } = O

        @::express = ( typed ) ->
          if _ = @_ then expression = edit {}, {  # Why `edit`???
            @attributes
            data        : cloneCategory   _.data
            methods     : cloneCategory   _.methods
            events      : cloneEvents     _.events
            guards      : cloneCategory   _.guards
            states      : cloneSubstates  _.substates, typed
            transitions : cloneCategory   _.transitions
          }
          if typed then new @Expression expression else expression

        cloneCategory = ( object ) ->
          return unless object?
          ( out = {}; break ) for key of object
          if out then for key, value of object
            out[ key ] = if value and typeof value is 'object'
            then clone value
            else value
          out

        cloneEvents = ( events ) ->
          return unless events?
          ( out = {}; break ) for type, emitter of events when emitter
          for type, emitter of events when emitter
            out[ type ] = clone emitter.items
          out

        cloneSubstates = ( substates, typed ) ->
          return unless substates?
          ( out = {}; break ) for name of substates
          for name, substate of substates
            out[ name ] = substate.express typed
          out



#### [mutate](#state--prototype--mutate)

Transactionally mutates `this` state by adding, updating, or removing items as
specified by the expression provided in `expr`.

      do =>
        { NIL, isArray, isEmpty, isPlainObject, edit, diff } = O

        @::mutate = ( expr ) ->
          { attributes, Expression } = this

          do @realize if attributes & VIRTUAL

Booleans to determine whether mutation of particular categories is permissible;
all content is mutable for the special case of a state being initialized.

          incipient = attributes & INCIPIENT
          mutable = incipient or attributes & MUTABLE
          notStrongImmutable = incipient or not ( attributes & IMMUTABLE )

Load the category collections.

          { data, methods, events, guards, substates, transitions } = @_

Validate the provided state expression.

          expr = new Expression expr unless expr instanceof Expression

The `initialize` method uses `mutate` for a real state’s initial build, but
with the resultant `mutate` event suppressed.

          before = @express() unless incipient

Since `mutate` is transactional, the `ATOMIC` flag must be used to signal the
methods utilized here that add or remove content to temporarily suppress their
usual emission of a `mutate` event.

          @attributes |= ATOMIC

###### Data

Data is already set up to handle differentials that contain `NIL` values.

          @data expr.data if expr.data

###### Methods

Methods are stored as a simple key mapping, and `addMethod` can be used both to
create an entry and to update an existing entry, without any additional
side-effects, so method expressions can simply be compared against the `NIL`
value.

          if mutable then for own name, method of expr.methods
            if method isnt NIL
            then @addMethod name, method
            else @removeMethod name

###### Events

Event listeners for a given event type might be expressed as either:

  * a simple `Array` of items to be added;
  * a plain `Object` that maps items to specific event `id`s in the internal
    emitter that should be added, updated, or deleted; or
  * an `Array` that also includes one or more such `Object`s.

          if mutable then for own type, event of expr.events
            events or = @_.events or = {}
            emitter = events[ type ]
            if event is NIL then do emitter?.empty; continue

If `event` contains items to be added, and an emitter does not already exist
for this event type, then one must be created.

            if not emitter and event and not isEmpty event
              emitter = events[ type ] = new StateEventEmitter this, type

            if isArray event
            then for element in event when element? and element isnt NIL
              if isPlainObject element
              then editEvent element, emitter
              else @addEvent type, element
            else editEvent event, emitter if isPlainObject event

            unless emitter.length
              do emitter.destroy
              delete events[ type ]

###### Guards

Guards are stored as simple objects, and altering them causes no side-effects,
so a deep `edit` is sufficient.

          if mutable and expr.guards
            guards or = @_.guards or = {}
            edit 'deep', guards, expr.guards

###### Substates

Substates are instances of `State`, which are either created, destroyed, or
recursively updated in place, as specified by `expr.states`.

By default, a state is **weakly immutable**, in which case its *direct*
contents cannot be altered, although any of its substates may yet be mutable,
so any submutations must therefore still be applied recursively to their
corresponding substates.

          if notStrongImmutable then for own name, stateExpr of expr.states
            if substates and name of substates
              if stateExpr is NIL
              then @removeSubstate name
              else substates[ name ].mutate stateExpr
            else @addSubstate name, stateExpr if stateExpr isnt NIL

###### Transitions

Transitions, as held by a `State`, are instances of `TransitionExpression`,
which are either created, deleted, or replaced, as specified by
`expr.transitions`.

          if mutable then for own name, transitionExpr of expr.transitions
            if transitions and name of transitions
              if transitionExpr is NIL
              then delete transitions[ name ]
              else transitions[ name ] =
                new TransitionExpression transitionExpr
            else @addTransition name, transitionExpr if transitionExpr isnt NIL

The transaction is complete, so clear `ATOMIC` to signal the `add...` methods
to emit individual `mutate` events as usual.

          @attributes &= ~ATOMIC

Finally the `before` snapshot is used to acquire the `delta` of the mutation,
which is emitted as part of a `mutate` event.

          unless incipient
            after = @express()
            delta = diff before, after
            unless isEmpty delta
              @emit 'mutate', [ expr, delta, before, after ], VIA_PROTO

          this

        editEvent = ( object, emitter ) ->
          { items } = emitter
          for own key, value of object
            if value is NIL then emitter.remove key
            else if value and value isnt items[ key ]
              emitter.set key, value




### [Attributes](#state--attributes)

Methods that inspect a state’s attributes.

> [Attributes](/docs/#concepts--attributes)
> [Attributes](/api/#state--attributes)

      isVirtual:     -> !!( @attributes & VIRTUAL )
      isMutable:     -> !!( @attributes & MUTABLE )
      isFinite:      -> !!( @attributes & FINITE )
      isStatic:      -> !!( @attributes & STATIC )
      isImmutable:   -> !!( @attributes & IMMUTABLE )
      isInitial:     -> !!( @attributes & INITIAL )
      isConclusive:  -> !!( @attributes & CONCLUSIVE )
      isFinal:       -> !!( @attributes & FINAL )
      isAbstract:    -> !!( @attributes & ABSTRACT )
      isConcrete:    -> !!( @attributes & CONCRETE )
      isDefault:     -> !!( @attributes & DEFAULT )
      isReflective:  -> !!( @attributes & REFLECTIVE )
      hasHistory:    -> !!( @attributes & HISTORY )
      isRetained:    -> !!( @attributes & RETAINED )
      isShallow:     -> !!( @attributes & SHALLOW )
      isConcurrent:  -> !!( @attributes & CONCURRENT )



### [Object model](#state--object-model)


#### [derivation](#state--prototype--derivation)

Returns a `State` array of this state’s superstate chain, starting after the
root state and ending at `this`. If `byName` is set to `true`, a string array
of the states’ names is returned instead.

> [derivation](/api/#state--methods--derivation)

      derivation: ( byName ) ->
        results = []; ss = this; while ( s = ss ) and ss = s.superstate
          results.push if byName then s.name or '' else s
        results.reverse()


#### [path](#state--prototype--path)

Returns this state’s fully qualified name.

*Alias:* **toString**

> [path](/api/#state--methods--path)

      path: -> @derivation( yes ).join '.'
      toString: @::path


#### [depth](#state--prototype--depth)

Returns the number of superstates this state has. The root state returns `0`,
its immediate substates return `1`, etc.

> [depth](/api/#state--methods--depth)

      depth: ->
        n = 0; s = this
        n += 1 while s = s.superstate
        n


#### [common](#state--prototype--common)

Returns the least common ancestor of `this` and `other`. If `this` is itself an
ancestor of `other`, or vice versa, then that ancestor is returned.

> [common](/api/#state--methods--common)

      common: ( other ) ->
        other = @query other unless other instanceof State
        if @depth() > other.depth() then s = other; other = this else s = this
        while s
          return s if s is other or s.isSuperstateOf other
          s = s.superstate
        null


#### [is](#state--prototype--is)

Determines whether `this` is `other`.

      is: ( other ) ->
        other = @query other unless other instanceof State
        other is this


#### [isIn](#state--prototype--isIn)

Determines whether `this` is or is a substate of `other`.

      isIn: ( other ) ->
        other = @query other unless other instanceof State
        other is this or other.isSuperstateOf this


#### [hasSubstate](#state--prototype--hasSubstate)

Determines whether `this` is or is a superstate of `other`.

      hasSubstate: ( other ) ->
        other = @query other unless other instanceof State
        other is this or @isSuperstateOf other


#### [isSuperstateOf](#state--prototype--isSuperstateOf)

Determines whether `this` is a superstate of `other`.

      isSuperstateOf: ( other ) ->
        other = @query other unless other instanceof State
        if superstate = other.superstate
          this is superstate or @isSuperstateOf superstate
        else no


#### [protostate](#state--prototype--protostate)

> [protostate](/api/#state--methods--protostate)

Returns `this` state’s **[protostate][]**, the `State` that both:

  1. belongs to the nearest possible prototype of `@owner`; and
  2. is taxonomically analogous to `this`, the inheriting **epistate**.

If the owner does not share an analogous [state tree][] with its immediate
prototype, or if that prototype’s tree does not contain a `State` analogous to
`this`, then the search is iterated up the owner’s prototype chain.

      protostate: ->
        return protostate if protostate = @_protostate

        { getPrototypeOf } = O
        { owner, root } = this
        { accessorName } = root
        path = @path()

Walk up the prototype chain, and, starting at each prototype’s root state, use
`this` state’s `path` to locate the nearest analogous `protostate`. If the
protostate is found on the `first` prototype, then a reference to it can be
memoized.

        first = prototype = getPrototypeOf owner
        while prototype
          if protostate = prototype[ accessorName ]? path, VIA_NONE
            @_protostate = protostate if prototype is first
            return protostate
          prototype = getPrototypeOf prototype


#### [isProtostateOf](#state--prototype--is-protostate-of)

Determines whether `this` is a state analogous to `state` on any object in the
prototype chain of `state`’s owner.

> [isProtostateOf](/api/#state--methods--is-protostate-of)

      isProtostateOf: ( other ) ->
        other = @query other unless other instanceof State
        if protostate = other.protostate()
          this is protostate or @isProtostateOf protostate
        else no


#### [defaultSubstate](#state--prototype--default-substate)

Returns the first substate marked `default`, or simply the first substate.
Recursion continues into the protostate only if no local substates are marked
`default`.

> [defaultSubstate](/api/#state--methods--default-substate)

      defaultSubstate: ( via = VIA_PROTO, first ) ->
        for s in substates = @substates()
          return s if s.attributes & DEFAULT
        first or substates.length and first = substates[0]
        if via & VIA_PROTO and protostate = @protostate()
          return protostate.defaultSubstate VIA_PROTO
        first


#### [initialSubstate](#state--prototype--initial-substate)

Performs a “depth-within-breadth-first” recursive search to locate the most
deeply nested `initial` state by way of the greatest `initial` descendant
state. Recursion continues into the protostate only if no local descendant
states are marked `initial`.

> [initialSubstate](/api/#state--methods--initial-substate)

      initialSubstate: ( via = VIA_PROTO ) ->
        i = 0; queue = [ this ]
        while subject = queue[ i++ ]
          for s in substates = subject.substates VIA_PROTO
            return s.initialSubstate( VIA_NONE ) or s if s.attributes & INITIAL
            queue.push s
        if via & VIA_PROTO and protostate = @protostate()
          return protostate.initialSubstate VIA_PROTO




### [Currency](#state--currency)

Methods that inspect or affect the owner’s current state.


#### [current](#state--prototype--current)

Gets the local state tree’s current state, which is authoritatively determined
by the root state.

> [current](/api/#state--methods--current)

      current: -> @root._current


#### [isCurrent](#state--prototype--is-current)

Returns a `Boolean` indicating whether `this` is the owner’s current state.

> [isCurrent](/api/#state--methods--is-current)

      isCurrent: -> this is @current()


#### [isActive](#state--prototype--is-active)

Returns a `Boolean` indicating whether `this` or one of its substates is the
owner’s current state.

> [isActive](/api/#state--methods--is-active)

      isActive: -> this is ( current = @current() ) or @isSuperstateOf current


#### [change](#state--prototype--change)

Forwards a `change` command to the root and returns its result. Calling with no
arguments directs the root to change to `this` state.

*Aliases:* **go**, **be**

> [change](/api/#state--methods--change)

      change: ( target, options ) ->
        ( root = @root ).change.apply root, arguments

      go: @::change
      be: @::change


#### [changeTo](#state--prototype--change-to)

> Not yet implemented.

Calls `change` without regard to a `target`’s retained internal state.

*Aliases:* **goTo**, **goto**

> See also: [`State::change`](#state--prototype--change)

      changeTo: ( target, options ) ->

      goTo: @::changeTo
      goto: @::goTo



### [Query](#state--querying)


#### [query](#state--prototype--query)

Matches a `selector` string with the state or states it represents, evaluated
first in the context of `this`, then its substates, and then its superstates,
until all locations in the state tree have been searched for a match of
`selector`.

Returns the matched `State`, or an `Array` containing the set of matched
states. If a state to be tested `against` is provided, a `Boolean` is returned,
indicating whether `against` is the matched state or is included in the
matching set.

If no matching state is found relative to the context of `this` state, then the
query is recursed `via` the substates, superstates, and protostates of `this`,
unless otherwise directed, such that a uniquely named state can be located by
name alone from anywhere in the state tree.

> [Selectors](/docs/#concepts--selectors)
> [query](/api/#state--methods--query)

      query: ( selector, against, via = VIA_ALL, toBeSkipped ) ->
        if typeof against is 'number'
          toBeSkipped = via; via = against; against = undefined

A few exceptional cases may be resolved early.

        unless selector?
          return if against is undefined then null else no
        if selector is '.'
          return if against is undefined then this else against is this
        if selector is ''
          return if against is undefined then @root else against is @root

Absolute wildcard expressions compared against the root state pass immediately.

        return yes if against and against is @root and /^\*+$/.test selector

Pure `.`/`*` expressions should not be recursed.

        via &= ~( VIA_SUB | VIA_SUPER ) if /^\.*\**$/.test selector

If `selector` is an absolute path, evaluate it from the root state as a
relative path.

        if selector.charAt(0) isnt '.'
          return @root.query '.' + selector, against, VIA_SUB | VIA_PROTO

An all-`.` `selector` must have one `.` trimmed to parse correctly.

        selector = selector.replace /^(\.+)\.$/, '$1'

Split `selector` into tokens, consume the leading empty-string straight away,
then parse the remaining tokens. A `cursor` reference to a matching `State` in
the tree is kept, beginning with the context state (`this`), and updated as
each token is consumed.

        parts = selector.split '.'
        i = 0; l = parts.length; cursor = this
        while cursor
          i += 1

Upon reaching the end of token stream, return the `State` currently referenced
by `cursor`.

          return ( if against then against is cursor else cursor ) if i >= l

Consume a token.

          name = parts[i]

Interpret a **single wildcard** as any *immediate* substate of the `cursor`
state parsed thus far.

          if name is '*'
            return cursor.substates() unless against
            return yes if cursor is against.superstate
            break

Interpret a **double wildcard** as any descendant state of the `cursor` state
parsed thus far.

          if name is '**'
            return cursor.substates yes unless against
            return yes if cursor.isSuperstateOf against
            break

Empty string, the product of leading/consecutive `.`s, implies `cursor`’s
superstate.

          if name is '' then cursor = cursor.superstate

Interpret any other token as an identifier that names a specific substate of
`cursor`.

          else if next = cursor.substate name then cursor = next

If no matching substate exists, the query fails for this context.

          else break

Recursively descend the tree, breadth-first, and retry the query with a
different context.

        if via & VIA_SUB
          i = 0; queue = [ this ]
          while subject = queue[ i++ ]
            for substate in subject.substates no, yes
              continue if substate is toBeSkipped
              result = substate.query selector, against, VIA_NONE
              return result if result
              queue.push substate

Recursively ascend the tree and retry the query, but skip `this` subtree during
the subsequent descent, since it’s already been searched.

        if via & VIA_SUPER
          return result if result = @superstate?.query( selector, against,
            via & VIA_SUB | VIA_SUPER, this if via & VIA_SUB )

Retry the query on the protostate.

        if via & VIA_PROTO
          return result if result = @protostate()?.query selector, against, via

All possibilities exhausted; no matches exist.

        return if against then no else null


#### [$](#state--prototype--dollarsign)

Convenience method that either aliases to `change` if passed a function for the
first argument, or aliases to `query` if passed a string — thereby mimicking
the behavior of the object’s accessor method.

> See also: `createAccessor`

      $: ( expr, args... ) ->
        if typeof expr is 'function'
          return @change.apply this, [ expr ].concat args if expr = expr()
        else if typeof expr is 'string' and
            ( match = expr.match rxTransitionArrow ) and
              method = transitionArrowMethods[ match[1] ]
          return if args.length
          then @[ method ].apply this, [ match[2] ].concat args
          else @[ method ] match[2]



### [Data](#state--data)


#### [data](#state--prototype--data)

Either retrieves or edits a block of data associated with this state.

If provided no argument, or an integer bit field, then `data` returns a copy
of the data attached to this state, including all data from inherited states,
unless specified otherwise by the `via` query flags.

If called with an object-typed argument, `data` edits the data held on this
state. For keys in `mutation` whose values are set to the `NIL` directive, the
matching keys in the state’s data are deleted. If the operation results in a
change to the state’s data, a `mutate` event is emitted for this state.

> [Data](/docs/#concepts--data)
> [data](/api/#state--methods--data)

      data: ( via = VIA_ALL ) ->

If the provided `via` argument is not a flags integer mask, and presumably an
object instead, then interpret this call as a *write* operation, and refer to
the parameter as `mutation`.

        mutation = via if via isnt via << 0
        if mutation
          { attributes } = this
          if attributes & INCIPIENT_OR_MUTABLE and not O.isEmpty mutation
            return @realize().data mutation if attributes & VIRTUAL
            delta = O.delta @_.data or = {}, mutation
            debug delta
            if not ( attributes & ATOMIC ) and delta and not O.isEmpty delta
              @emit 'mutate', [ mutation, delta ], VIA_PROTO
          this

Otherwise *read* and return a copy of `this` state’s `data`, including data
inherited `via` superstates and protostates, unless directed otherwise.

        else O.clone via & VIA_SUPER and @superstate?.data(),
                     via & VIA_PROTO and @protostate()?.data VIA_PROTO,
                     @_?.data


#### [has](#state--prototype--has)

      has: ( key, via = VIA_ALL ) ->
        viaSuper = via & VIA_SUPER
        viaProto = via & VIA_PROTO

        !!(
          ( data = @_?.data ) and O.has( data, key ) or
          viaProto and @protostate()?.has( key, VIA_PROTO ) or
          viaSuper and @superstate?.has( key, VIA_SUPER | viaProto )
        )


#### [get](#state--prototype--get)

      get: ( key, via = VIA_ALL ) ->
        viaSuper = via & VIA_SUPER
        viaProto = via & VIA_PROTO

        ( data = @_?.data ) and O.lookup( data, key ) or
        viaProto and @protostate()?.get( key, VIA_PROTO ) or
        viaSuper and @superstate?.get( key, VIA_SUPER | viaProto )


#### [let](#state--prototype--let)

Assigns a `value` to a `key` within `this` state’s `data` storage. If no such
key already exists, it is added.

> See also: `set`

> [let](/api/#state--methods--let)

      let: ( key, value ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE  # should warn
        return @realize().let key, value if attributes & VIRTUAL

Assignment proceeds only if the `value` being written is not the same as the
`displaced` data that is being overwritten.

        data = @_.data or = {}
        if value isnt displaced = O.lookup data, key
          { assign } = O
          assign data, key, value
          assign ( edit = {} ).data = {}, key, value
          assign ( delta = {} ).data = {}, key, displaced
          @emit 'mutate', [ edit, delta ], VIA_PROTO

        value


#### [set](#state--prototype--set)

Assigns a `value` to the nearest extant `key` within the `data` storage
inherited along the superstate chain of `this`.

For `let` versus `set`, the notion of a property’s **scope** along the
superstate chain is comparable to the same at the language level for variable
bindings within functions being shadowed versus unshadowed, respectively.

> [let](/api/#state--methods--let)
> [set](/api/#state--methods--set)

      set: ( key, value ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE
        do @realize if attributes & VIRTUAL

Find the superstate that holds the inherited property and mutate it.

        s = this; while s
          if s.attributes & MUTABLE and ( data = s._.data ) and key of data
            return s.let key, value
          s = s.superstate

If no mutable property already exists along the superstate chain, then default
to a `let`.

        @let key, value


#### [delete](#state--prototype--delete)

      delete: ( key ) ->
        return unless @attributes & MUTABLE
        NIL is @let key, NIL



### [Methods](#state--methods)


#### [method](#state--prototype--method)

Retrieves the named method for this state. Providing an optional `out` object
allows the appropriate `context` for a state-bound method to be delivered as a
property of `out`; if included, `context` is confined to the local state tree.

> [method](/api/#state--methods--method)

      method: ( methodName, via = VIA_ALL, out, boxed ) ->
        realized = ~@attributes & VIRTUAL

> During the pseudo-loop block, the `context` reference should be considered
  provisional, because its potential value is in part a product of the manner
  in which its accompanying `method` was retrieved. After `break`ing out of the
  block, `method` can be type-checked and `context` may be kept or discarded as
  appropriate.

        loop # once

First seek the named method locally.

          if realized
            method = @_?.methods?[ methodName ]
            if method? then context = this
            else if record = @_?.__dispatch_table__?[ methodName ]
              [ method, context ] = record
            break if method?

If no method is held locally, start traversing, first up the protostate chain.
If this succeeds, the provisional `context` *must be the epistate* inheriting
the method (constrast with the `VIA_SUPER` case).

          if ( viaProto = via & VIA_PROTO ) and
              method = @protostate()?.method methodName, VIA_PROTO, out, yes
            context = this
            inherited = yes; break

If no method is found yet, continue traversing up the superstate chain. If this
succeeds, the provisional `context` *must be the superstate* from which the
method is inherited.

          if via & VIA_SUPER and method = @superstate?.method \
              methodName, VIA_SUPER | viaProto, out, yes
            { context } = out if out?
            inherited = yes; break

The method cannot be found.

          context = null
          break # always

        if method?

If `method` is a function, it is not state-bound, so `context` is unnecessary.

          if typeof method is 'function'
            context = null

Iff `this` is a realized `State`, inherited lookup results can be memoized in
the local dispatch table.

          if realized and inherited and useDispatchTables
            table = @_?.__dispatch_table__ or = {}
            table[ methodName ] = [ method, context ]

Unbox a state-bound function unless directed otherwise.

          if not boxed and method.type is 'state-bound-function'
            method = method.fn

Export `method` and `context` together if the `out` reference was provided.

> Callers who know that `method` will be unbound need not provide an `out`.

        if out?
          out.method = method
          out.context = context

        method


#### [methodNames](#state--prototype--method-names)

Returns an `Array` of names of methods defined for this state.

> [methodNames](/api/#state--methods--method-names)

      methodNames: ->
        O.keys methods if methods = @_?.methods


#### [addMethod](#state--prototype--add-method)

Adds a method to this state. The provided `fn` may be any of:

  1.  A proper function, which will be called in the context of `@owner`;
  2.  A boxing of a *bound* function as prepared by `state.bind`, which will
      cause the boxed function to be called in the context of either `this`
      `State` or the *epistate* inheriting the method;
  3.  A boxing of a *fixed* function as prepared by `state.fix`, whose boxed
      function will be closed over hard references to `this` as `autostate`,
      and to the *protostate* of `this`, as `protostate`.

If a method called `methodName` does not already exist in the state tree, then
the owner is provided a *dispatcher* to accommodate calls to the appropriate
state’s implementation of this method.

> See also: `state.bind`, `state.fix`

> [addMethod](/api/#state--methods--add-method)

      addMethod: ( methodName, fn ) ->
        return unless @attributes & INCIPIENT_OR_MUTABLE

If `fn` boxes a *state-fixed* function, then partially apply that function to
extract the actual method, closed over references to the locality of `this`.

        if typeof fn is 'object' and fn.type is 'state-fixed-function'
          fn = fn.fn this, @protostate()

        throw TypeError unless typeof fn is 'function' or
          fn?.type is 'state-bound-function'

        { owner } = this

Skip ahead if the owner is already set up with a dispatcher for this method.

        unless ( ownerMethod = owner[ methodName ] )?.isDispatcher
          { root } = this

Create a new dispatcher method for `owner`. Its original method, if it has one,
will be retained by the dispatcher, so that if the state tree is `destroy`ed
later, the method can be reinstated on `owner`.

          owner[ methodName ] =
            createDispatcher root.accessorName, methodName, ownerMethod

Unless we’re adding directly to `root`, copy `ownerMethod` to `root` — which
will not have an implementation for this method. (If it did, then `ownerMethod`
would already be a dispatcher.) From the root state it can still serve as
`owner`’s default implementation, available to any of its `State`s that do not
override that method.

          if ownerMethod? and this isnt root
            methods = root._?.methods or = {}
            methods[ methodName ] = ownerMethod

        methods = @_?.methods or = {}
        methods[ methodName ] = fn


#### [removeMethod](#state--prototype--remove-method)

Dissociates the named method from this state object and returns its function.

> [removeMethod](/api/#state--methods--remove-method)

      removeMethod: ( methodName ) ->
        return unless @attributes & MUTABLE and ( methods = @_?.methods ) and
          fn = methods[ methodName ]
        delete methods[ methodName ]
        fn


#### [hasMethod](#state--prototype--has-method)

Determines whether `this` possesses or inherits a method named `methodName`.

> [hasMethod](/api/#state--methods--has-method)

      hasMethod: ( methodName ) ->
        method = @method methodName


#### [hasOwnMethod](#state--prototype--has-own-method)

Determines whether `this` directly possesses a method named `methodName`.

> [hasOwnMethod](/api/#state--methods--has-own-method)

      hasOwnMethod: ( methodName ) ->
        !! @method methodName, VIA_NONE


#### [apply](#state--prototype--apply)

Finds a state method and applies it in the appropriate context.

If the named method does not exist locally and cannot be inherited, then
`noSuchMethod` events are emitted, and the call returns `undefined`.

> [apply](/api/#state--methods--apply)

      apply: ( methodName, args ) ->

First try to resolve the method quickly from the local dispatch table.

        if record = @_?.__dispatch_table__?[ methodName ]
          [ method, context ] = record
          method = method.fn if method?.type is 'state-bound-function'

Resort to a proper lookup if the fast way turns up nothing.

        unless method?
          if method = @method methodName, VIA_ALL, out = {}
            { context } = out

Bail out gracefully if the method definitively cannot be resolved.

          else
            @emit 'noSuchMethod', [ methodName, args ]
            @emit 'noSuchMethod:' + methodName, args
            return

If at this point a `context` is provided, this means that `method` is a
state-bound function, and `context` will be the appropriately bound `State`. If
no `context` exists, this means that `method` is a typical non-state-bound
function, which is meant to be invoked in the usual fashion, just as if it were
called directly as a method of `this` state’s `owner`.

        method.apply context or @owner, args


#### [call](#state--prototype--call)

Variadic `apply`.

> [call](/api/#state--methods--call)

      call: ( methodName, args... ) ->
        @apply methodName, args



### [Events](#state--events)


#### [event](#state--prototype--event)

Returns a registered event listener, or the number of listeners registered, for
a given event `type`.

If an `id` as returned by `addEvent` is provided, the event listener associated
with that `id` is returned. If no `id` is provided, the number of event
listeners registered to `type` is returned.

> [event](/api/#state--methods--event)

      event: ( eventType, id ) ->
        return unless emitter = @_?.events?[ eventType ]
        return emitter.length if id is undefined
        id = emitter.key id if typeof id is 'function'
        emitter.get id


#### [addEvent](#state--prototype--add-event)

Binds an event listener to the specified `eventType` and returns a unique
identifier for the listener.

*Alias:* **on**

> [addEvent](/api/#state--methods--add-event)

      addEvent: ( eventType, fn, context ) ->
        do @realize if @attributes & VIRTUAL
        events = @_.events or = {}
        unless O.hasOwn.call events, eventType
          events[ eventType ] = new StateEventEmitter this
        events[ eventType ].add fn, context

      on: @::addEvent


#### [removeEvent](#state--prototype--remove-event)

Unbinds the event listener with the specified `id` that was supplied by
`addEvent`.

*Alias:* **off**

> [removeEvent](/api/#state--methods--remove-event)

      removeEvent: ( eventType, id ) ->
        @_?.events?[ eventType ].remove id

      off: @::removeEvent


#### [emit](#state--prototype--emit)

Invokes all listeners bound to the given event type.

Arguments for the listeners can be passed as an array to the `args` parameter.

Callbacks are invoked in the context of `this`, or as specified by `context`.

Callbacks bound to superstates and protostates are also invoked, unless
otherwise directed by the `via` query flags.

*Alias:* **trigger**

> [emit](/api/#state--methods--emit)

      emit: ( eventType, args, context, via = VIA_ALL ) ->
        return if typeof eventType isnt 'string'

        if typeof args is 'number'
          via = context; context = args; args = undefined
        if typeof context is 'number'
          via = context; context = undefined

        if args then ( args = [ args ] unless O.isArray args ) else args = []

Event callbacks are applied in the context of their location along the
superstate chain of `this`; i.e., events are inherited transparently via
protostates.

        @_?.events?[ eventType ]?.emit args, context or this
        if via & VIA_PROTO
          @protostate()?.emit eventType, args, context or this, VIA_PROTO
        if via & VIA_SUPER
          ( ss = @superstate )?.emit eventType, args, context or ss
        return

      trigger: @::emit



### [Guards](#state--guards)


#### [guard](#state--prototype--guard)

Gets a **guard** entity for this state. A guard is a value or function that
will be evaluated during a transition to determine whether an owner’s currency
will be *admitted* into or *released* from the `State` to which the guard is
applied.

Guards are inherited from protostates, but not from superstates.

> See also: [`evaluateGuard`](#state--private--evaluate-guard)
> [guard](/api/#state--methods--guard)

      guard: ( guardType ) ->
        if guard = @_?.guards?[ guardType ] then O.clone guard
        else @protostate()?.guard( guardType ) or undefined


#### [addGuard](#state--prototype--add-guard)

Adds a guard to this state, or augments an existing guard with additional
entries.

> [addGuard](/api/#state--methods--add-guard)

      addGuard: ( guardType, guard ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE
        do @realize if attributes & VIRTUAL
        guards = @_.guards or = {}
        O.edit guards[ guardType ] or = {}, guard


#### [removeGuard](#state--prototype--remove-guard)

Removes a guard from this state, or removes specific entries from an existing
guard.

> [removeGuard](/api/#state--methods--remove-guard)

      removeGuard: ( guardType, args... ) ->
        { attributes } = this
        return if attributes & VIRTUAL
        return unless attributes & MUTABLE and guards = @_.guards
        return null unless guard = guards[ guardType ]
        return ( guard if delete guards[ guardType ] ) unless args.length

        for key in O.flatten args when typeof key is 'string'
          entry = guard[ key ]
          return entry if delete guard[ key ]



### [Substates](#state--substates)


#### [substate](#state--prototype--substate)

Retrieves the named substate of `this` state. If no such substate exists in the
local state, any identically named substate held on a protostate will be
returned.

> [substate](/api/#state--methods--substate)

      substate: ( name, via = VIA_PROTO ) ->

First scan for any virtual active substates in the local state tree.

        s = @root._current
        while s?.attributes & VIRTUAL and ss = s.superstate
          return s if ss is this and s.name is name
          s = ss

Otherwise retrieve a real substate, either locally or from a protostate.

        @_?.substates?[ name ] or
        via & VIA_PROTO and @protostate()?.substate name


#### [substates](#state--prototype--substates)

Returns an `Array` of this state’s substates. If the boolean `deep` argument is
`true`, returns a depth-first flattened array containing all of this state’s
descendant states.

> [substates](/api/#state--methods--substates)

      substates: ( deep, virtual ) ->
        result = []

Include virtual substates in the returned set, if any are present.

        if virtual and ( s = @root._current ) and s.attributes & VIRTUAL and
            @isSuperstateOf s
          while s and s isnt this and s.attributes & VIRTUAL and
              ss = s.superstate
            result.unshift s if deep or ss is this
            s = ss

Include real substates.

        for own name, substate of @_?.substates
          result.push substate
          result = result.concat substate.substates yes if deep

        result


#### [addSubstate](#state--prototype--add-substate)

Creates a state from the supplied `expression` and adds it as a substate of
this state. If a substate with the same `name` already exists, that state is
first destroyed and then displaced.

> [addSubstate](/api/#state--methods--add-substate)

      addSubstate: ( name, expression ) ->
        { attributes } = this
        unless attributes & INCIPIENT
          return if attributes & FINITE
          return unless attributes & MUTABLE
        do @realize if attributes & VIRTUAL

        substates = @_.substates or = {}
        do substate.destroy if substate = substates[ name ]

        substate = if expression instanceof State
        then expression.realize() if expression.superstate is this
        else new State this, name, expression

        return null unless substate

        substates[ name ] = substate


#### [removeSubstate](#state--prototype--remove-substate)

Removes the named substate from the local state, if possible.

> [removeSubstate](/api/#state--methods--remove-substate)

      removeSubstate: ( name ) ->
        { attributes } = this
        return if attributes & VIRTUAL

        substates = @_?.substates
        return unless substate = substates?[ name ]
        return unless attributes & MUTABLE or substate?.attributes & DESTROYED

If a transition is underway involving `substate`, the removal must fail.

        return no if ( transition = @root._transition ) and (
          substate.isSuperstateOf( transition ) or
          substate is transition.origin or substate is transition.target
        )

Currency must be evacuated before the state can be removed.

        @change this, forced: yes if @root._current.isIn substate

        delete substates[ name ]

        substate



### [Transitions](#state--transitions)

A `State` may hold **transition expressions** that describe a `Transition`
involving itself or any descendant `State`.


#### [transition](#state--prototype--transition)

Returns the named transition expression held on this state.

> [transition](/api/#state--methods--transition)

      transition: ( name ) -> @_?.transitions?[ name ]


#### [transitions](#state--prototype--transitions)

Returns an object containing all of the transition expressions defined
on this state.

> [transitions](/api/#state--methods--transitions)

      transitions: -> O.clone @_?.transitions


#### [addTransition](#state--prototype--add-transition)

Registers a transition expression to this state.

> [addTransition](/api/#state--methods--add-transition)

      addTransition: ( name, expression ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE
        do @realize if attributes & VIRTUAL
        unless expression instanceof TransitionExpression
          expression = new TransitionExpression expression
        transitions = @_.transitions or = {}
        transitions[ name ] = expression


#### [removeTransition](#state--prototype--remove-transition)

Removes a transition expression from this state.

> [removeTransition](/api/#state--methods--remove-transition)

      removeTransition: ( name ) ->
        { attributes } = this
        return if attributes & VIRTUAL
        return unless attributes & MUTABLE and transitions = @_.transitions
        transition = transitions[ name ]
        delete transitions[ name ] if transition
        transition




