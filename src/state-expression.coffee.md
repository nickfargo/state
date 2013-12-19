    O                    = require 'omicron'
    state                = require './state-function'
    State                = require './state'
    GuardMap             = require './guard-map'
    TransitionExpression = require './transition-expression'

    {
      STATE_ATTRIBUTES
      STATE_ATTRIBUTE_MODIFIERS
      STATE_EXPRESSION_CATEGORIES
      STATE_EXPRESSION_CATEGORY_SYNONYMS
      STATE_EVENT_TYPES
      GUARD_ACTIONS
    } =
        state

    module.exports =



## [StateExpression](#state-expression)

A **state expression** is a data structure that formalizes a definition of
a state’s contents.

States are declared by calling the module’s exported `state()` function and
passing it a descriptive plain object map. This input may be expressed in a
shorthand format, in which case it is rewritten into an unambiguous long form
that is used internally to create `State` instances.

    class StateExpression

      { NIL, isNumber, isPlainObject, isArray } = O
      { assign, edit, clone, invert } = O
      { rxDelegatedEvent } = state
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
      synonymMap   = STATE_EXPRESSION_CATEGORY_SYNONYMS
      eventTypes   = assign STATE_EVENT_TYPES
      guardActions = assign GUARD_ACTIONS



### [Constructor](#state-expression--constructor)

      constructor: ( attributes, expr ) ->
        if typeof attributes is 'string' then expr or = {}
        else unless expr? then expr = attributes; attributes = undefined

        expr = interpret expr unless expr instanceof StateExpression
        edit 'deep all', this, expr

        if attributes?
          attributes = encode attributes unless isNumber attributes
        else { attributes } = expr if expr

        @attributes = attributes or NORMAL



### [Private functions](#state-expression--private)


#### [interpret](#state-expression--private--interpret)

Transforms a plain-object `expr` into a well-formed `StateExpression`, making
the appropriate type inferences for any shorthand notation encountered.

      interpret = ( expr ) ->

Start with a null-valued `result` object keyed with the category names.

        result = assign STATE_EXPRESSION_CATEGORIES, null

###### Categorization

        for own key, value of expr

**Priority 1:** Recognize an explicitly named category object.

          category = categoryMap[ key ] or synonymMap[ key ]
          if category? and value?
            result[ category ] =
              if typeof value is 'string' then value
              else if isArray value then value[..]
              else clone result[ category ], value
            continue

**Priority 2:** Do a nominative type match for explicit expression instances.
The `state` function serves as a sentinel `value` indicating empty-expression.

          if value is state or value instanceof StateExpression
            category = 'substates'
          else if value instanceof TransitionExpression
            category = 'transitions'

          if category?
            item = result[ category ] or = {}
            item[ key ] = value
            continue

**Priority 3:** Use keys and value types to infer implicit categorization.

          if eventTypes[ key ]? or rxDelegatedEvent.test key
            category = 'events'
          else if guardActions[ key ]?
            category = 'guards'
          else if typeof value is 'function' or ( type = value?.type ) and
              ( type is 'state-bound-function' or
                type is 'state-fixed-function' )
            category = 'methods'
          else if value is NIL or isPlainObject value
            category = 'substates'
          else if typeof value is 'string'
            category = 'events'

          if category?
            item = result[ category ] or = {}
            item[ key ] = value
            continue

###### Normalization

Event values are coerced into an array.

        for own key, value of object = result.events when not isArray value
          object[ key ] = [ value ]

Guard values must be represented within a `GuardMap`.

        for own key, value of object = result.guards
          unless value is NIL or value instanceof GuardMap
            object[ key ] = new GuardMap key, value

Transition values must be a `TransitionExpression`.

        for own key, value of object = result.transitions
          unless value is NIL or value instanceof TransitionExpression
            object[ key ] = new TransitionExpression value

State values must resolve to a `StateExpression`. They may be supplied as a
plain object, or as a live `State` instance, which is automatically `express`ed
to a formal `StateExpression`.

        for own key, value of object = result.substates
          if value is state
            object[ key ] = new StateExpression
          else if value instanceof State
            object[ key ] = value.express yes
          else unless value is NIL or value instanceof StateExpression
            object[ key ] = new StateExpression value

        result


#### [encode](#state-expression--private--encode)

Returns the bit-field integer represented by the provided set of `attributes`.

      encode = ( attributes ) ->
        attributes = assign attributes if typeof attributes is 'string'
        result = NORMAL
        for own key, value of attributes when key of attributeMap
          result |= STATE_ATTRIBUTES[ attributeMap[ key ] ]
        result


#### [decode](#state-expression--private--decode)

Returns the space-delimited set of attribute names represented by the provided
bit-field integer `number`.

      decode = ( number ) ->
        ( value for key, value of attributeFlags when number & key ).join ' '



### [Class methods](#state-expression--class-methods)


#### [untype](#state-expression--class-methods--untype)

Returns the `StateExpression` provided by `expr` as a plain-`Object`.

      @untype = untype = ( expr ) ->
        result = {}
        result[ key ] = value for own key, value of expr
        s[ name ] = untype subexpr for name, subexpr of s = result.states
        result


#### [encodeAttributes](#state-expression--class-methods--encode-attributes)

      @encodeAttributes = encode


#### [decodeAttributes](#state-expression--class-methods--decode-attributes)

      @decodeAttributes = decode
