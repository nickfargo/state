    RootState        = null
    StateExpression  = null

    module.exports =



## [state()](#state-function)

Invoking the exported `state` function is the primary point of entry into the
module. The `state` function is used either to:

1. generate a formal `StateExpression` object; or
2. bestow an arbitrary `owner` object with a working state implementation.

All arguments are optional. If only one `object`-typed argument is provided,
it is assigned to the `expression` parameter. If no `owner` is present,
`state()` returns a `StateExpression` based on the contents of `expression`
(and `attributes`). If both an `owner` and `expression` are present, `state()`
acts in the second capacity: it causes `owner` to become stateful, creating a
new `RootState` (and subordinate state tree) based on `expression`, and returns
the owner’s initial `State`.

The `attributes` argument may include any of the words defined in
`STATE_ATTRIBUTE_MODIFIERS`, which are encoded into the provided `expression`.

> See also: `STATE_ATTRIBUTES`
> [`state()`](/api/#state-function)
> [The `state` function](/docs/#getting-started--the-state-function)

    state = ( owner, attributes, expression, options ) ->
      if arguments.length < 2
        if typeof owner is 'string'
        then attributes = owner
        else expression = owner
        owner = undefined
      else
        if typeof owner is 'string'
          options = expression
          expression = attributes
          attributes = owner
          owner = undefined
        if typeof attributes isnt 'string'
          options = expression
          expression = attributes
          attributes = undefined

Formalize the provided `expression` (even if `expression` is already a formal
`StateExpression`), incorporating any provided `attributes`.

      expression = new StateExpression attributes, expression

With an `owner` present, the inferred intent is to *implement* `expression`
into `owner`; otherwise the inference is only to *formalize* the `expression`
as a `StateExpression`.

      if owner
      then ( new RootState owner, expression, options )._current
      else expression



### Package includes

A set of package-global metadata and functions are included as properties of
the exported `state` function.

    ( require './includes' ).apply state



### Forward imports

    RootState        = require './root-state'
    StateExpression  = require './state-expression'
