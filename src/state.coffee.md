    O                     = require 'omicron'
    state                 = require './state-function'
    StateEventEmitter     = null
    StateExpression       = null
    TransitionExpression  = null

    { STATE_ATTRIBUTES, TRAVERSAL_FLAGS } = state

    module.exports =



## [State](#state)

A **state** defines a subset of behavior for its **owner** object. Each
[`State`](/api/#state) holds a reference to a `superstate`, from which it may
inherit more generic behavior, forming a **state tree** rooted by a single
`RootState`.

> [States](/docs/#concepts--states)
> [Object model](/docs/#concepts--object-model)
> [Superstates and substates](/docs/#concepts--object-model--superstates-and-substates)

The owner’s `RootState` designates exactly one of the `State`s in its tree as
its `current` state. This reference may be **transitioned** to a different
`State` in the tree, causing the owner’s projected behavior to change.

An owner and its tree of `State`s are also heritable along the owner’s
prototype chain. Inheritors of a stateful prototype effectively possess all of
the prototype’s `State`s, but each inheritor can adopt its own `current` state
and instigate transitions independently of the prototype.

> [Protostates and epistates](/docs/#concepts--object-model--protostates-and-epistates)

    class State

      { memoizeProtostates, useDispatchTables } = state.options

      { env, NIL, isArray, isEmpty, has, hasOwn } = O
      { assign, edit, delta, clone, lookup, flatten } = O

Bit field constants will be used extensively throughout the class’s constructor
and methods, so make them available as free variables.

      {
        INCIPIENT, ATOMIC, DESTROYED
        VIRTUAL
        PARASTATIC
        MUTABLE, FINITE, STATIC, IMMUTABLE
        INITIAL, CONCLUSIVE, FINAL
        ABSTRACT, CONCRETE, DEFAULT
        REFLECTIVE
        HISTORY, RETAINED, SHALLOW
        CONCURRENT
        NORMAL
      } =
          assign this, STATE_ATTRIBUTES

For methods that query related states, the default behavior is to recurse
through substates, superstates, and protostates.

      { VIA_NONE, VIA_SUB, VIA_SUPER, VIA_PROTO, VIA_ALL } =
          assign this, TRAVERSAL_FLAGS

Precompute certain useful attribute combinations.

      MUTABLE_OR_FINITE     = MUTABLE | FINITE
      ABSTRACT_OR_CONCRETE  = ABSTRACT | CONCRETE
      INCIPIENT_OR_VIRTUAL  = INCIPIENT | VIRTUAL
      INCIPIENT_OR_MUTABLE  = INCIPIENT | MUTABLE

A bit mask indicates the attributes that can be inherited via protostates.

      PROTO_HERITABLE_ATTRIBUTES =
        PARASTATIC  |
        MUTABLE     |  FINITE      |  STATIC     |  IMMUTABLE  |
        INITIAL     |  CONCLUSIVE  |  FINAL      |
        ABSTRACT    |  CONCRETE    |  DEFAULT    |
        REFLECTIVE  |
        HISTORY     |  RETAINED    |  SHALLOW    |
        CONCURRENT  |
        NORMAL



### [Supporting classes](#state--supporting-classes)

These are keyed here as a placeholder, and will be valued with a forward import
at the end of this class definition.

      Metaobject: null
      Expression: null



### [Constructor](#state--constructor)

The constructor is limited to setting the references that define `this`
`State`’s relations, and then computing its `attributes` bit mask based on
those relations and the intrinsic heritability of each attribute.

Only afterward is the `State`’s `Metaobject`, as defined in a provided
`expression`, then `initialize`d into the instance, if necessary.

      constructor: ( base, @name, expression ) ->

###### Relation definitions

The `base` argument can specify either a `superstate` from which to inherit,
or an `owner` for which to act as a new `root` state.

        if base instanceof State
        then superstate = base; root = superstate.root; owner = root.owner
        else superstate = null; root = this; owner = base

        @owner = owner
        @root = root
        @superstate = superstate
        @protostate = protostate = @getProtostate() or null

The linearized resolution `order` for `this` will be set later, either when the
instance is `realize`d, or on demand if a lookup is performed and the `order`
is not set.

        @order = null

###### Attribute inheritance masking

Explicitly defined *literal* attributes for `this` state are encoded as a bit
field integer within `expression`, and then superimposed atop the *inherited*
attribute values acquired from `this` state’s superstate and protostate.

        attributes = expression?.attributes or NORMAL

The `mutable` and `finite` attributes can be inherited from the superstate
straight away.

        if superstate?
          superAttr = superstate.attributes
          attributes |= superAttr & MUTABLE_OR_FINITE

A subset of the attributes may be inherited from protostates.

        if protostate?
          protoAttr = protostate.attributes & PROTO_HERITABLE_ATTRIBUTES

Literal `concrete` forcibly contradicts literal `abstract`; if a bad production
includes both attributes, negate `abstract`.

          attributes &= ~ABSTRACT if attributes & CONCRETE

Literal `abstract` may override inherited `concrete`, and vice versa, so filter
those attributes out of the protostate before inheriting.

          if attributes & ABSTRACT_OR_CONCRETE
            protoAttr &= ~ABSTRACT_OR_CONCRETE
          attributes |= protoAttr

If at this point the state is not `abstract`, then it is definitely `concrete`.

        attributes |= CONCRETE if ~attributes & ABSTRACT

Literal or inherited `immutable` contradicts `mutable` absolutely, and implies
`finite`.

        attributes |= ( superAttr | protoAttr ) & IMMUTABLE
        if attributes & IMMUTABLE
          attributes = attributes & ~MUTABLE | FINITE

        @attributes = attributes

###### Offloaded initialization

        @initialize expression unless attributes & VIRTUAL

###### Debug properties

For easy viewing in the inspector.

        if env.debug
          @[' <path>']       = @path()
          @['<attributes>']  = StateExpression.decodeAttributes attributes



### [Private entities](#state--private)


#### [createDispatcher](#state--private--create-dispatcher)

For each method defined in any of the owner’s states, a **dispatcher** must be
created and assigned on the owner itself at the `methodName` key. Calls to
`owner.methodName` are then delegated by the dispatcher to the owner’s current
state, from which the appropriate implementation for the method will be located
and applied, and its result returned to the call site.

> [`addMethod`](#state--prototype--add-method)
> [Dispatchers](/docs/#concepts--methods--dispatchers)

      createDispatcher = do ->
        toString = -> "[dispatcher]"
        ( accessorName, methodName, original ) ->
          dispatcher = -> @[ accessorName ]().apply methodName, arguments
          dispatcher.isDispatcher = yes
          dispatcher.toString = toString if env.debug
          dispatcher.original = original if original
          dispatcher



### [Essential methods](#state--essential-methods)


#### [initialize](#state--prototype--initialize)

Builds out the state’s members based on the expression provided.

> [Constructor](#state--constructor)

      initialize: ( expression ) ->
        { attributes } = this
        return if attributes & VIRTUAL

        @attributes |= INCIPIENT
        @realize expression
        @attributes &= ~INCIPIENT

        @emit 'construct', expression, VIA_PROTO
        this


#### [realize](#state--prototype--realize)

Transforms an incipient or **virtual** `State` into a **real** state.

Initialization of a `State`’s contents is offloaded from the
[constructor](#state--constructor) via
[`initialize`](#state--prototype--initialize) to here.

> [`virtualize`](#state--prototype--virtualize)
> [realize](/api/#state--methods--realize)
> [Virtual epistates](/docs/#concepts--object-model--virtual-epistates)

      realize: ( expression ) ->
        { attributes, name } = this
        return this unless attributes & INCIPIENT_OR_VIRTUAL

Begin realization higher in the superstate chain if necessary, adding each
newly realized state to the `substates` collection of its real superstate.

        if attributes & VIRTUAL
          if ss = @superstate
            do ss.realize if ss.attributes & VIRTUAL
            substates = ss._.substates ?= {}
            do substates[ name ].destroy if substates[ name ]?
            substates[ name ] = this
          @attributes &= ~VIRTUAL

A `State`’s `Metaobject` is stored in an underscore `_` property; the
existence of `_` in `this` implies that `this` must be a realized state.

        @_ ?= new @Metaobject

Normalize any declarations of `parastates`. These will be used later in the
outer `realize` function to recursively compute a `linearization` for `this`
state and for its descendant substates.

        if parastates = expression?.parastates
          if isArray parastates then parastates = parastates.join ','
          throw TypeError unless typeof parastates is 'string'
          parastates = parastates.split /\s*,\s*/
          if parastates.length
            @_.parastates = parastates
            @attributes |= PARASTATIC

Populate the rest of the empty metaobject by “mutating” against `expression`.

        @mutate expression if expression?

Realizing a root state requires that, for each of the owner’s own methods, if
there exists at least one stateful implementation of that method located higher
in the owner’s prototype chain, then the owner’s implementation of that method
must be copied into the root, where it defines the owner’s default behavior.

        if this is @root then for own key, method of @owner
          @addMethod key, method if key isnt 'constructor' and
            typeof method is 'function' and not method.isDispatcher and
            @method key, VIA_PROTO

The superstate and parastates of `this` `State` are `linearize`d into a defined
`order`. Because the `State`s of a state tree are constructed bottom-up, in the
case of an **incipient** state, the linearization step must be deferred to the
**root**, which will then recursively `linearize` its descendants from the top
down, *after* each one has been instantiated and situated in the tree.

        @linearize VIA_SUB if this is @root or ~attributes & INCIPIENT

        this


#### [virtualize](#state--prototype--virtualize)

Creates, if necessary, a virtualized **epistate** of `this` protostate within
the state tree to which `inheritor` belongs, and also creates as many virtual
ancestor superstates as necessary to reach a real `State` within that tree.

Returns the state on `inheritor`’s state tree for which `this` is a protostate.
This will be the newly created virtual state, unless virtualization was
unnecessary, in which case it will be the extant real epistate of `this`.

> [Virtual epistates](/docs/#concepts--object-model--virtual-epistates)

      virtualize: ( inheritor ) ->

Verify relation between respective `owner`s of `inheritor` and `this`.

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


#### [linearize](#state--prototype--linearize)

Computes, records, and returns the array of `State`s that define the `order` of
resolution, or **linearization**, for inheritance of `this` amongst itself and
ancestors that share a common `owner` (and thus inhabit a common state tree).

This method is an adaptation of the C3 linearization algorithm to the `State`
model, where the returned list begins with `this` and is followed by a
monotonic ordering of its ancestors.

By definition a `State`’s **protostates** are excluded from `order`. Traversal
`VIA_ALL` proceeds over the concatenation of the protostate chains for each
`State` in `order`; this set inherently preserves the monotonicity of `order`.

Parastates are specified by the selector paths contained in the `parastates`
array of the metaobject `this._`. **Epistates** inherit any parastate paths
defined by their **protostates**, and may override their ordering.

      linearize: do ->

##### getParastateDeclarations

Returns the concatenation of `this` `State`’s own and `protostate`-derived
declarations of `parastates`.

        getParastateDeclarations = ->
          head = @_?.parastates
          tail = getParastateDeclarations.call ps if ps = @protostate
          if tail? then ( head?.concat tail ) ? tail else head

##### merge

Creates and returns a monotonic ordered set of `State`s from the provided
`lists`, where `lists` is an array of arrays, consisting of an array of
“parent” states, preceded by arrays that represent, in order, the linearization
of each “parent” state.

        merge = ( out, lists ) ->
          return out unless lists.length
          for headList, index in lists when headList?
            head = headList[0]; bad = no
            for otherList in lists when otherList isnt headList
              i = 1; while item = otherList[ i++ ]
                if item is head then bad = yes; break
              break if bad
            continue if bad
            out.push head
            remainingLists = []; for list in lists
              do list.shift if list[0] is head
              remainingLists.push list if list.length
            return merge out, remainingLists
          throw new TypeError "Ambiguous resolution order for '#{ out.pop() }'"

##### linearize

Computes the linearization of `this` from its named parastates and referenced
superstate, and saves this array as `this.order`.

        linearize = ( via = VIA_NONE ) ->
          if this is @root then order = [this] else

Determine the ordered set of `State`s from which `this` inherits. By rule any
parastates precede the superstate. Declarations of parastates include those
inherited from protostates; all parastates are resolved to unique `own`
`State`s of the prevailing `owner`’s state tree.

            parents = []
            if paths = getParastateDeclarations.call this
              { owner } = this
              for path in paths
                unless parastate = state.own owner, path
                  throw new ReferenceError "Unresolvable parastate '#{ path }'"
                parents.push parastate unless parastate in parents
            parents.push @superstate

Create an array of the linearizations for each `parent`, followed by a list of
the `parents` themselves, then `merge` each of these `lists` to create a single
ordered set that defines the monotonic linearization of `this`.

            lists = []
            for parent in parents
              lists.push ( parent.order ? parent.linearize() )[..]
            lists.push parents
            order = merge [this], lists

Set the determined `order`, then recurse downward if so directed (e.g., this is
instigated from the root state as the last step of realization, after all of
its substates and descendants are in place).

          @order = order
          s.linearize via for own name, s of @_.substates if via & VIA_SUB
          order


#### [express](#state--prototype--express)

Returns an **expression** of `this` state — a data structure that contains an
exported snapshot of the state’s own contents.

By default the returned expression is returned as a plain object; if `typed`
is truthy, the expression is a formally typed `StateExpression`.

      express: do ->
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

        return express = ( typed ) ->
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


#### [mutate](#state--prototype--mutate)

Transactionally mutates `this` state by adding, updating, or removing items as
specified by the expression provided in `expr`.

      mutate: do ->
        { NIL, isArray, isEmpty, isPlainObject, edit, diff } = O

        editEvent = ( object, emitter ) ->
          { items } = emitter
          for own key, value of object
            if value is NIL then emitter.remove key
            else if value and value isnt items[ key ]
              emitter.set key, value

        return mutate = ( expr ) ->
          { attributes, Expression } = this

###### Preparation steps

Booleans to determine whether mutation of particular categories is permissible;
all content is mutable for the special case of a state being initialized.

          incipient = attributes & INCIPIENT
          return if not incipient and attributes & IMMUTABLE
          mutable = incipient or attributes & MUTABLE

Realize `this` state if necessary, then load the category collections.

          do @realize if attributes & VIRTUAL
          { data, methods, events, guards, substates, transitions } = @_

Validate the provided state expression.

          expr = new Expression expr unless expr instanceof Expression

Hold onto an expression of a state’s contents `before` the mutation, to be used
for comparison later on the `mutate` event. This step does not pertain to an
`incipient` state, which will be “mutating” against nothing, and so will
suppress the emission of a `mutate` event.

          before = @express() unless incipient

Since `mutate` is transactional, the `ATOMIC` flag must be used to signal the
methods utilized here that add or remove content to temporarily suppress their
usual emission of a `mutate` event.

          @attributes |= ATOMIC

###### Data mutations

Data is already set up to handle differentials that contain `NIL` values.

          @data expr.data if expr.data

###### Method mutations

Methods are stored as a simple key mapping, and `addMethod` can be used both to
create an entry and to update an existing entry, without any additional
side-effects, so method expressions can simply be compared against the `NIL`
value.

          if mutable then for own name, method of expr.methods
            if method isnt NIL
            then @addMethod name, method
            else @removeMethod name

###### Event mutations

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

###### Guard mutations

Guards are stored as simple objects, and altering them causes no side-effects,
so a deep `edit` is sufficient.

          if mutable and expr.guards
            guards or = @_.guards or = {}
            edit 'deep', guards, expr.guards

###### Substate mutations

Substates are instances of `State`, which are either created, destroyed, or
recursively updated in place, as specified by `expr.states`.

By default, a state is **weakly immutable**, in which case its *direct*
contents cannot be altered, although any of its substates may yet be mutable,
so any submutations must therefore still be applied recursively to their
corresponding substates.

          for own name, stateExpr of expr.substates
            if substates and name of substates
              if stateExpr is NIL
              then @removeSubstate name
              else substates[ name ].mutate stateExpr
            else @addSubstate name, stateExpr if stateExpr isnt NIL

###### Transition mutations

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

###### Cleanup and export

The transaction is complete, so clear `ATOMIC` to signal the `add...` methods
to emit individual `mutate` events as usual.

          @attributes &= ~ATOMIC

Finally the `before` snapshot is used to acquire the `residue` of the mutation,
which is emitted as part of a `mutate` event.

          unless incipient
            after = @express()
            residue = diff before, after
            unless isEmpty residue
              @emit 'mutate', [ expr, residue, before, after ], VIA_PROTO

          this


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
          else return no if ( transition.origin.isIn this ) or
            ( transition.target.isIn this )

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

The metaobject should be cleared explicitly, as it may contain a cyclical
reference to `this` at the head of its `linearization` array. This should be
sufficient to allow garbage-collection since only `this` should ever hold a
reference to the metaobject.

        @_ = null

A flag is set that can be observed later by anything retaining a reference to
this state (e.g. a memoization) which would be withholding it from being
garbage-collected.

        @attributes |= DESTROYED

A non-root state must remove itself from its superstate.

        superstate?.removeSubstate @name

        yes



### [Attribute methods](#state--attribute-methods)

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



### [Relational methods](#state--relational-methods)


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
        via & VIA_PROTO and @protostate?.substate name


#### [substates](#state--prototype--substates)

Returns an array of this state’s immediate substates. If the boolean `virtual`
is `true`, any active virtual epistates will be included as well.

> [substates](/api/#state--methods--substates)
> [Virtual epistates](/docs/#concepts--object-model--virtual-epistates)

      substates: ( virtual, deep ) ->
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
          result = result.concat substate.substates undefined, yes if deep

        result


#### [descendants](#state--prototype--descendants)

Returns a depth-first flattened array containing all of this state’s descendant
substates.

> [descendants](/api/#state--methods--descendants)

      descendants: ( virtual ) -> @substates virtual, yes


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


#### [isIn](#state--prototype--is-in)

Determines whether `this` is or is a substate of `other`.

      isIn: ( other ) ->
        other = @query other unless other instanceof State
        other is this or other.isSuperstateOf this


#### [hasSubstate](#state--prototype--has-substate)

Determines whether `this` is or is a superstate of `other`.

      hasSubstate: ( other ) ->
        other = @query other unless other instanceof State
        other is this or @isSuperstateOf other


#### [isSuperstateOf](#state--prototype--is-superstate-of)

Determines whether `this` is a superstate of `other`.

      isSuperstateOf: ( other ) ->
        other = @query other unless other instanceof State
        if superstate = other.superstate
          this is superstate or @isSuperstateOf superstate
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
        if via & VIA_PROTO and protostate = @protostate
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
          for s in substates = subject.substates undefined, !!VIA_PROTO
            return s.initialSubstate( VIA_NONE ) or s if s.attributes & INITIAL
            queue.push s
        if via & VIA_PROTO and protostate = @protostate
          return protostate.initialSubstate VIA_PROTO


#### [getProtostate](#state--prototype--get-protostate)

> [getProtostate](/api/#state--methods--get-protostate)

Returns `this` state’s **protostate**, the `State` that both:

  1. belongs to the nearest possible prototype of `@owner`; and
  2. is taxonomically analogous to `this`, the inheriting **epistate**.

If the owner does not share an analogous state tree with its immediate
prototype, or if that prototype’s tree does not contain a `State` analogous to
`this`, then the search is iterated up the owner’s prototype chain.

      getProtostate: ->
        { getPrototypeOf } = O
        { owner, root } = this
        { accessorName } = root
        path = @path()

Walk up the prototype chain, and, starting at each prototype’s root state, use
`this` state’s `path` to locate the nearest analogous `protostate`.

        prototype = getPrototypeOf owner
        while prototype
          if protostate = prototype[ accessorName ]? path, VIA_NONE
            return protostate
          prototype = getPrototypeOf prototype
        null


#### [isProtostateOf](#state--prototype--is-protostate-of)

Determines whether `this` is a state analogous to `state` on any object in the
prototype chain of `state`’s owner.

> [isProtostateOf](/api/#state--methods--is-protostate-of)

      isProtostateOf: ( other ) ->
        other = @query other unless other instanceof State
        if protostate = other.protostate
          this is protostate or @isProtostateOf protostate
        else no


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

      query: ( selector, against, via, toBeSkipped ) ->
        if typeof against is 'number'
          toBeSkipped = via; via = against; against = undefined
        via = VIA_ALL unless via?

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
            return cursor.substates undefined, yes unless against
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
            for substate in subject.substates yes
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
          return result if result = @protostate?.query selector, against, via

All possibilities exhausted; no matches exist.

        return if against then no else null


#### [$](#state--prototype--dollarsign)

Convenience method that either aliases to `change` if passed a function for the
first argument, or aliases to `query` if passed a string — thereby mimicking
the behavior of the object’s accessor method.

> [`createAccessor`](/source/root-state.html#root-state--private--create-accessor)

      $: ( expr, args... ) ->
        if typeof expr is 'function'
          return @change.apply this, [ expr ].concat args if expr = expr()
        else if typeof expr is 'string' and
            ( match = expr.match rxTransitionArrow ) and
              method = transitionArrowMethods[ match[1] ]
          return if args.length
          then @[ method ].apply this, [ match[2] ].concat args
          else @[ method ] match[2]



### [Currency methods](#state--currency-methods)

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

Forwards a `change` command to `root` and returns its result. Calling with no
arguments implicitly directs the root to change to `this` state.

*Aliases:* **go**, **be**

> [change](/api/#state--methods--change)

      change: ( target, options ) ->
        ( root = @root ).change.apply root, arguments

      go: @::change
      be: @::change



### [Data methods](#state--data-methods)


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
> [data (read)](/api/#state--methods--data--read)
> [data (write)](/api/#state--methods--data--write)

      data: ( via = VIA_ALL, out ) ->

If the provided `via` argument is not a flags integer mask, and presumably an
object instead, then interpret this call as a *write* operation, and refer to
the parameter as `mutation`.

        mutation = via if via isnt via << 0
        if mutation
          { attributes } = this
          if attributes & INCIPIENT_OR_MUTABLE and not isEmpty mutation
            return @realize().data mutation if attributes & VIRTUAL
            residue = delta @_.data ?= {}, mutation
            if ~attributes & ATOMIC and residue and not isEmpty residue
              @emit 'mutate', [ mutation, residue ], VIA_PROTO
          this

Otherwise *read* and return a copy of `this` state’s `data`, including data
inherited `via` superstates and protostates, unless directed otherwise.

        else
          out ?= {}
          for relative in @order ? @linearize() by -1
            continue unless via & VIA_SUPER or relative is this
            edit 'deep all', out,
              ( relative.protostate?.data VIA_PROTO, out if via & VIA_PROTO ),
              relative._?.data
          out


#### [has](#state--prototype--has)

Determines whether a property with the given `key` is contained within `this`
state’s `data` storage, or that of an ancestral protostate, parastate, or
superstate, unless directed otherwise by `via`.

      has: ( key, via = VIA_ALL ) ->
        viaSuper = via & VIA_SUPER
        viaProto = via & VIA_PROTO
        for relative in @order ? @linearize()
          s = relative; while s?
            return yes if ( data = s._?.data )? and hasOwn.call data, key
            if viaProto then s = s.protostate else break
            continue if viaSuper
        no


#### [get](#state--prototype--get)

Retrieves the value of a `key` within `this` state’s `data` storage, or from
that of an ancestral protostate, parastate, or superstate, unless directed
otherwise by `via`.

      get: ( key, via = VIA_ALL ) ->
        viaSuper = via & VIA_SUPER
        viaProto = via & VIA_PROTO
        for relative in @order ? @linearize()
          s = relative; while s?
            if ( data = s._?.data )? and hasOwn.call data, key
              return data[ key ]
            if viaProto then s = s.protostate else break
          continue if viaSuper


#### [let](#state--prototype--let)

Assigns a `value` to a `key` within `this` state’s `data` storage. If no such
key already exists, it is added.

> [`set`](#state--prototype--set)
> [let](/api/#state--methods--let)

      let: ( key, value ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE  # should warn
        return @realize().let key, value if attributes & VIRTUAL

Assignment proceeds only if the `value` being written is not the same as the
`displaced` data that is being overwritten.

        data = @_.data or = {}
        if value isnt displaced = lookup data, key
          assign data, key, value
          assign ( mutation = {} ).data = {}, key, value
          assign ( residue = {} ).data = {}, key, displaced
          @emit 'mutate', [ mutation, residue ], VIA_PROTO

        value


#### [set](#state--prototype--set)

Assigns a `value` to an existing `key` within the `data` storage of the nearest
mutable ancestral parastate or superstate of `this`. Returns the equivalent of
a `let` operation on `this` if no such ancestor can be affected.

Only `State`s that belong to `this.owner` can be affected by `set`; their
protostates cannot.

> [let](/api/#state--methods--let)
> [set](/api/#state--methods--set)

      set: ( key, value ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE
        do @realize if attributes & VIRTUAL

Find the nearest `State` along the linearization path of `this` whose `data`
storage contains a property with the given `key`, and mutate that property with
the given `value` if allowed to do so. If these steps do not complete, delegate
to `let`.

        for relative in @order ? @linearize()
          if ( data = relative._?.data )? and hasOwn.call data, key
            return relative.let key, value if relative.attributes & MUTABLE
            break
        @let key, value


#### [delete](#state--prototype--delete)

Removes a property from `this` state’s `data` storage, provided that `this` is
mutable.

      delete: ( key ) ->
        return unless @attributes & MUTABLE
        NIL is @let key, NIL



### [Method methods](#state--method-methods)


#### [method](#state--prototype--method)

Retrieves the named method for this state. Providing an optional `out` object
allows the appropriate `context` for a state-bound method to be delivered as a
property of `out`; if included, `context` is confined to the local state tree.

> [method](/api/#state--methods--method)

      method: ( methodName, via = VIA_ALL, out, returnBoxed ) ->
        { attributes } = this
        realized = ~attributes & VIRTUAL

> During the pseudo-loop block, the `context` reference should be considered
  provisional, because its potential value is in part a product of the manner
  in which its accompanying `method` was retrieved. After `break`ing out of the
  block, if `method` is a state-bound function, then `context` will be either
  kept and exported via `out`, or discarded otherwise.

        loop # once

First seek a local or memoized inherited implementation of the named method.

          if realized
            if method = @_?.methods?[ methodName ]
              context = this
              break
            if record = @_?.__dispatch_table__?[ methodName ]
              [ method, context ] = record
              break if method?

If an implementation is not available locally, seek an inherited method along
the protostate chain. If this succeeds, the provisional `context` will be the
*epistate* that inherits the method.

          if viaProto = via & VIA_PROTO
            if method = @protostate?.method methodName, VIA_PROTO, out, yes
              context = this
              inherited = yes
              break

If no local or protostatic method exists, seek an inherited method along the
linearization path. If this succeeds, the provisional `context` will be the
*superstate or parastate* from which the method is inherited.

          if via & VIA_SUPER
            for parent in @order ? @linearize() when parent isnt this
              if method = parent.method methodName, viaProto, out, yes
                context = out?.context ? null
                inherited = yes
                break
            break if method?

The method does not exist.

          context = null
          break # always

        if method?

If `method` is a function, it is not state-bound, so `context` is unnecessary.

          if typeof method is 'function'
            context = null

Iff `this` is a realized `State`, inherited lookup results can be memoized in
the local dispatch table.

          if realized and inherited and useDispatchTables
            table = @_.__dispatch_table__ ?= {}
            table[ methodName ] = [ method, context ]

Unbox a state-bound function unless directed otherwise.

          unless returnBoxed
            method = method.fn if method.type is 'state-bound-function'

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
        keys methods if methods = @_?.methods


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

> [`state.bind`](/source/export-static.html#utility-functions--bind)
> [`state.fix`](/source/export-static.html#utility-functions--fix)
> [addMethod](/api/#state--methods--add-method)

      addMethod: ( methodName, fn ) ->
        return unless @attributes & INCIPIENT_OR_MUTABLE

If `fn` boxes a *state-fixed* function, then partially apply that function to
extract the actual method, closed over references to the locality of `this`.

        if typeof fn is 'object' and fn.type is 'state-fixed-function'
          fn = fn.fn this, @protostate

        unless typeof fn is 'function' or fn?.type is 'state-bound-function'
          throw new TypeError "Must supply a plain, bound, or fixed function"

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



### [Event methods](#state--event-methods)


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
        unless hasOwn.call events, eventType
          events[ eventType ] = new StateEventEmitter this

        if fn.type is 'state-fixed-function'
          fn = fn.fn this, @protostate

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

Invokes all listeners bound to the given event type. Callbacks inherited from
protostates, parastates, and superstates are also invoked, unless otherwise
directed by the traversal flags of `via`.

Arguments to be supplied to callbacks can be passed as an array to `args`.

Unless `context` is provided explicitly, a provisional `State` `context` is
determined for event callbacks that are state-bound functions. This `context`
will be either `this` or an *epistate* that inherits events from `this`.

Normal, unbound callbacks are invoked in the conventional context of `@owner`.

*Alias:* **trigger**

> [emit](/api/#state--methods--emit)

      emit: ( eventType, args, context, via = VIA_ALL ) ->
        return if typeof eventType isnt 'string'

        if typeof args is 'number'
          via = context; context = args; args = undefined
        if typeof context is 'number'
          via = context; context = undefined

        args = [args] if args? and not isArray args

Provisional `context` is flattened onto `this.owner`’s state tree.

        @_?.events?[ eventType ]?.emit args, context or this
        if via & VIA_PROTO
          @protostate?.emit eventType, args, context or this, VIA_PROTO
        if via & VIA_SUPER
          for relative in @order ? @linearize() when relative isnt this
            relative.emit eventType, args, context ? relative

        return

      trigger: @::emit



### [Guard methods](#state--guard-methods)


#### [guard](#state--prototype--guard)

Gets a **guard** entity for this state. A guard is a value or function that
will be evaluated during a transition to determine whether an owner’s currency
will be *admitted* into or *released* from the `State` to which the guard is
applied.

Guards are inherited from protostates, but not from parastates or superstates.

> [`evaluateGuard`](#state--private--evaluate-guard)
> [guard](/api/#state--methods--guard)

      guard: ( guardType ) ->
        if guard = @_?.guards?[ guardType ] then clone guard
        else @protostate?.guard( guardType ) or undefined


#### [addGuard](#state--prototype--add-guard)

Adds a guard to this state, or augments an existing guard with additional
entries.

> [addGuard](/api/#state--methods--add-guard)

      addGuard: ( guardType, guard ) ->
        { attributes } = this
        return unless attributes & INCIPIENT_OR_MUTABLE
        do @realize if attributes & VIRTUAL
        guards = @_.guards or = {}
        edit guards[ guardType ] or = {}, guard


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

        for key in flatten args when typeof key is 'string'
          entry = guard[ key ]
          return entry if delete guard[ key ]



### [Transition methods](#state--transition-methods)

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

      transitions: -> clone @_?.transitions


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




### [Forward imports](#state--forward-imports)

    State::Metaobject     = require './state-metaobject'
    State::Expression =
    StateExpression       = require './state-expression'
    StateEventEmitter     = require './state-event-emitter'
    TransitionExpression  = require './transition-expression'
