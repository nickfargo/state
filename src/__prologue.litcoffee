Copyright (C) 2011-2013 Nick Fargo. `LICENSE` MIT.

**State** implements state-driven behavior directly into JavaScript objects.
> [statejs.org](/)
> [blog](/blog/)
> [docs](/docs/)
> [api](/api/)
> [tests](/tests/)
> <a class="icon-invertocat" href="http://github.com/nickfargo/state"></a>

    "use strict"

    global = this

The lone dependency of **State** is [Omicron][], which helps with object
manipulation tasks, such as differential operations.

    O = require?('omicron') or global.O or throw ReferenceError

    meta =
      VERSION: '0.1.0'

      O: O
      env: O.env

      noConflict: do ->
        original = global.state
        -> global.state = original; this

      options:
        memoizeProtostates: yes
        useDispatchTables: no

    rxTransitionArrow      = /^\s*([\-|=]>)\s*(.*)/
    transitionArrowMethods = '->': 'change', '=>': 'changeTo'

A unique no-op function is necessary for the special case of the root state’s
capacity as a *dispatch backstop* when a method is called for which no other
currently active states possess an implementation.

    rootNoop = ->

Creates a bit field map on a given `object` by associating each string in a
list of `names` as a key to a single-bit integer value. Bit values are applied
to keys in order, increasing from `1 << offset` onward.

    bitfield = ( object = {}, names, offset = 0 ) ->
      names = names.split /\s+/ if typeof names is 'string'
      object[ key ] = 1 << index + offset for key, index in names
      object

    debug = -> console.log.apply console, arguments if O.env.debug



### [Global constants](#constants)


`NIL` is a sentinel identity used by diff/patch operations to indicate deletion
or nonexistence.

    { NIL } = O


#### [Name sets](#constants--name-sets)

The **state attribute modifiers** are the subset of attribute names that are
valid or reserved keywords for the `attributes` argument in a call to the
exported `state()` function.

    STATE_ATTRIBUTE_MODIFIERS = """
      mutable finite static immutable
      initial conclusive final
      abstract concrete default
      reflective
      history retained shallow versioned
      concurrent
    """

    STATE_EXPRESSION_CATEGORIES =
      'data methods events guards states transitions'

    STATE_EVENT_TYPES =
      'construct depart exit enter arrive destroy mutate noSuchMethod'

    GUARD_ACTIONS =
      'admit release'

    TRANSITION_PROPERTIES =
      'origin source target action conjugate'

    TRANSITION_EXPRESSION_CATEGORIES =
      'methods events guards'

    TRANSITION_EVENT_TYPES =
      'construct destroy enter exit start end abort'


#### [State attributes](#constants--state-attributes)

Each `State` instance stores its attribute values as a bit field, using the
constants enumerated here.

    STATE_ATTRIBUTES = bitfield { NORMAL: 0 }, """
      INCIPIENT
      ATOMIC
      DESTROYED
      VIRTUAL
    """ + ' ' + STATE_ATTRIBUTE_MODIFIERS.toUpperCase()


#### [Traversal flags](#constants--traversal-flags)

Traversal operations use these flags to restrict their recursive scope.

    TRAVERSAL_FLAGS = bitfield { VIA_NONE: 0, VIA_ALL: ~0 }, """
      VIA_SUB
      VIA_SUPER
      VIA_PROTO
    """




[Omicron]: https://github.com/nickfargo/omicron
