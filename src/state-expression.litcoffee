## [StateExpression](#state-expression)

A **state expression** is a data structure that formalizes a definition of
a state’s contents.

States are declared by calling the module’s exported `state()` function and
passing it a descriptive plain object map. This input may be expressed in a
shorthand format, in which case it is rewritten into an unambiguous long form
that is used internally to create `State` instances.

    State::Expression = class StateExpression

      { isNumber, isPlainObject, assign, edit, clone, invert } = O
      { NORMAL } = STATE_ATTRIBUTES

      attributeMap = do ->
        for key, value of object = assign STATE_ATTRIBUTE_MODIFIERS
          object[ key ] = key.toUpperCase()
        object

      attributeFlags = do ->
        for key, value of object = invert STATE_ATTRIBUTES
          object[ key ] = value.toLowerCase()
        object

      categoryMap  = assign STATE_EXPRESSION_CATEGORIES
      eventTypes   = assign STATE_EVENT_TYPES
      guardActions = assign GUARD_ACTIONS


### [Constructor](#state-expression--constructor)

      constructor: ( attributes, map ) ->
        if typeof attributes is 'string' then map or = {}
        else unless map
          map = attributes; attributes = undefined

        map = interpret map unless map instanceof StateExpression
        edit 'deep all', this, map

        if attributes?
          attributes = encodeAttributes attributes unless isNumber attributes
        else { attributes } = map if map

        @attributes = attributes or NORMAL



### [Private functions](#state-expression--private)


#### [interpret](#state-expression--private--interpret)

Transforms a plain object map into a well-formed `StateExpression`, making the
appropriate type inferences for any shorthand notation encountered.

      interpret = ( map ) ->

Start with a null-valued map keyed with the category names.

        result = assign STATE_EXPRESSION_CATEGORIES, null

        for own key, value of map

If `value` is just a reference to the exported `state` function, interpret that
as an empty state expression.

          value = new StateExpression if value is state

###### Categorization

**Priority 1:** Do a nominative type match for explicit expression instances.

          category =
            if value instanceof StateExpression then 'states'
            else if value instanceof TransitionExpression then 'transitions'
          if category
            item = result[ category ] or = {}
            item[ key ] = value

**Priority 2:** Recognize an explicitly named category object.

          else if key of result and value
            result[ key ] = clone result[ key ], value

**Priority 3:** Use keys and value types to infer implicit categorization.

          else
            category =
              if eventTypes[ key ]? or typeof value is 'string'
                'events'
              else if guardActions[ key ]?
                'guards'
              else if typeof value is 'function' or ( type = value?.type ) and
                  ( type is 'state-bound-function' or
                    type is 'state-fixed-function' )
                'methods'
              else if value is NIL or isPlainObject value
                'states'
            if category
              item = result[ category ] or = {}
              item[ key ] = value

###### Coersion

Event values are coerced into an array.

        for own key, value of object = result.events
          if typeof value is 'function' or typeof value is 'string'
            object[ key ] = [ value ]

Guards are represented as an object keyed by selector, so non-object values are
coerced into a single-element object with the value keyed to the wildcard
selector `*`.

        for own key, value of object = result.guards
          object[ key ] = '*': value unless isPlainObject value

Transition values must be a `TransitionExpression`.

        for own key, value of object = result.transitions
          unless value is NIL or value instanceof TransitionExpression
            object[ key ] = new TransitionExpression value

State values must resolve to a `StateExpression`. They may be supplied as a
plain object, or as a live `State` instance, which is automatically `express`ed
to a formal `StateExpression`.

        for own key, value of object = result.states
          if value instanceof State
            object[ key ] = value.express true
          else unless value is NIL or value instanceof StateExpression
            object[ key ] = new StateExpression value

        result



### [Class methods](#state-expression--class-methods)


#### [encodeAttributes](#state-expression--class--encode-attributes)

Returns the bit-field integer represented by the provided set of `attributes`.

      @encodeAttributes = encodeAttributes = ( attributes ) ->
        attributes = assign attributes if typeof attributes is 'string'
        result = NORMAL
        for own key, value of attributes when key of attributeMap
          result |= STATE_ATTRIBUTES[ attributeMap[ key ] ]
        result


#### [decodeAttributes](#state-expression--class--decode-attributes)

Returns the space-delimited set of attribute names represented by the provided
bit-field integer `number`.

      @decodeAttributes = decodeAttributes = ( number ) ->
        ( value for key, value of attributeFlags when number & key ).join ' '


#### [untype](#state-expression--class-methods--untype)

Returns the `StateExpression` provided by `expr` as a plain-`Object`.

      @untype = untype = ( expr ) ->
        result = {}
        result[ key ] = value for own key, value of expr
        s[ name ] = untype subexpr for name, subexpr of s = result.states
        result

