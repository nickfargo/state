    O = require 'omicron'



    module.exports =



## [GuardMap](#guard-map)

A **guard** can be described as a triple consisting of a **guard type** string,
a **selector** string, and a list of **predicates**. Predicates are nominally
pure, boolean-valued binary functions, whose parameters accept two `State`
references as arguments:

* The complementary `State` *against* which the guard will be evaluated; and
* The contextual `State` *for* which the guard will be evaluated.

If a predicate is boxed as a **state bound function** with `state.bind` then it
will be invoked in the context of the contextual (“for”) `State`; otherwise it
will be invoked in the context of the contextual `State`’s **owner** object.

Guards are grouped by guard type into `GuardMap` structures, wherein they are
contained by a `map` object that maps selector keys to predicate-list values.

Guards are employed both by `State`s, as **state guards**, to govern the
viability of a potential transition that would involve the guarded `State`,
and by `TransitionExpression`s, as **transition guards**, to determine which
from among possibly many `TransitionExpression` candidates a `Transition`
should be instantiated.

    class GuardMap

      { trim, isArray, isEmpty } = O



### [Constructor](#guard-map--constructor)

      constructor: ( @guardType, expression ) ->
        @map = interpret expression



### [Private functions](#guard-map--private)

      truePredicate = -> true
      falsePredicate = -> false


#### [predicateOf](#guard-map--private--predicate-of)

Returns the appropriate boolean-valued thunk for the provided `value`.

      predicateOf = ( value ) ->
        if value then truePredicate else falsePredicate


#### [coerceToPredicates](#guard-map--private--coerce-to-predicates)

Converts each non-function element of a provided `list` into a thunk of that
element’s boolean value.

      coerceToPredicates = ( list ) ->
        for element, index in list when typeof element isnt 'function'
          list[ index ] = predicateOf element
        list


#### [interpret](#guard-map--private--interpret)

Returns an object that normalizes the structure of the provided `expression`.

      interpret = ( expression ) ->
        return null unless expression?

Accept a string `expression` by interpreting it as a selector to be mapped to
a predicate list that will evaluate to `true`.

        if typeof expression is 'string'
          map = {}
          map[ expression ] = [truePredicate]
          map

Accept a function-typed `expression` as the lone predicate for the any-state
selector.

        else if typeof expression is 'function'
          '***': [ expression ]

For an array `expression`, coerce its elements to predicates, and assume the
any-state selector.

        else if isArray expression
          '***': coerceToPredicates expression[..]

Shallow-copy an object `expression` that maps `selector`s to predicate `list`s,
and coerce list elements as necessary.

        else if typeof expression is 'object'
          map = {}; for own selector, list of expression
            list = if isArray list then list[..] else [list]
            map[ selector ] = coerceToPredicates list
          map

Coerce any other `expression` to a predicate thunk on the any-state selector.

        else
          '***': [ predicateOf expression ]



### [Methods](#guard-map--methods)


#### [get](#guard-map--prototype--get)

Retrieves a copy of the predicate list to which the provided `selector` key is
mapped.

      get: ( selector ) ->
        @map[ selector ]?[..]


#### [add](#guard-map--prototype--add)

      add: ( selector, predicates ) ->
        map = @map ?= {}
        list = map[ selector ] ?= []

        if typeof predicates is 'function'
          list.push predicates
        else if isArray predicates then for predicate in predicates
          predicate = predicateOf predicate if typeof predicate isnt 'function'
          list.push predicate
        else
          list.push predicateOf predicates
        return


#### [remove](#guard-map--prototype--remove)

      remove: ( selector ) ->
        return null unless list = @map[ selector ]
        delete @map[ selector ]
        list


#### [evaluate](#guard-map--prototype--evaluate)

      evaluate: ( againstState, asState ) ->
        { guardType } = this
        { owner } = asState

        return yes if isEmpty @map

The `asState.query` call must receive an `against` `State` that is not epitypal
to `asState`, so if necessary, walk up to the protostate of `againstState` that
is at the prototypal level of `asState`, and `queryAgainst` that.

        queryAgainst = againstState
        until queryAgainst.root is asState.root or
              queryAgainst.root.isProtostateOf asState.root
          unless queryAgainst = queryAgainst.protostate
            0 and console.log againstState.root.print againstState
            0 and console.log asState.root.print asState
            throw new Error "Unrelated: '#{againstState}', '#{asState}'"

        for own selectors, predicates of @map when predicates?.length > 0
          succeededAtLeastOnce = no unless succeededAtLeastOnce

          matched = no; for selector in trim( selectors ).split /\s*,+\s*/
            break if matched = asState.query selector, queryAgainst
          continue unless matched

          for predicate in predicates when predicate?
            if predicate is no then return no
            else if typeof predicate is 'function'
              context = owner
            else if predicate.type is 'state-bound-function'
              context = asState
              predicate = predicate.fn
            else if predicate then continue

            unless predicate.call context, againstState, asState, guardType
              return no

          succeededAtLeastOnce = yes

        return succeededAtLeastOnce or no


#### [clone](#guard-map--prototype--clone)

      clone: -> new @constructor @guardType, @map
