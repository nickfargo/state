    RootState        = null
    StateExpression  = null

    module.exports =



## [state()](#state-function)

The primary point of entry into the module is to invoke the exported `state`
function. This is used either to:

1. generate a formal `StateExpression` object; or
2. bestow any given `owner` object with a working state implementation.

###### PARAMETERS

* [`owner`] : object

* [`attributes`] : string — A whitespace-delimited set of attribute keywords.

* [`expression`] : object | `StateExpression`

* [`options`] : object — A map that includes any of the following properties:

  * `name` : string — A name to be given to the **accessor** method that will
    be added to `owner`. Defaults to `'state'`.

  * `initial` : string — A selector that names a specific `State`. Providing
    this option overrides any `initial` attributes borne by `owner`’s states.

###### DISCUSSION

All arguments are optional. If only one `object`-typed argument is provided,
it is assigned to the `expression` parameter. If no `owner` is present,
`state()` returns a `StateExpression` based on the contents of `expression`
(and `attributes`). If both an `owner` and `expression` are present, `state()`
acts in the second capacity: it causes `owner` to become stateful, creating a
new `RootState` (and subordinate state tree) based on `expression`, and returns
the owner’s initial `State`.

The `attributes` argument may include any of the words defined in
`STATE_ATTRIBUTE_MODIFIERS`, which are encoded into the provided `expression`.

###### SEE ALSO

> [`STATE_ATTRIBUTES`](./export-static.html#bit-field-enums--state-attributes)

> [`state()`](/api/#state-function)
> [The `state` function](/docs/#getting-started--the-state-function)

###### SOURCE

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

      if owner?
      then implement owner, attributes, expression, options
      else define attributes, expression



### [Accessory functions](#state-function--accessory-functions)


#### [define](#state-function--accessory-functions--define)

    state.define =

    define = ( attributes, expression ) ->
      new StateExpression attributes, expression



#### [implement](#state-function--accessory-functions--implement)

    state.implement =

    implement = ( owner, attributes, expression, options ) ->
      { name, initial } = options if options?
      stateExpression = new StateExpression attributes, expression
      root = new RootState owner, stateExpression, name, initial
      root._current



### [Static includes](#state-function--static-includes)

A set of package-global metadata and functions are included as properties of
the exported `state` function.

> These must be required ahead of the forward imports.

    ( require './export-static' ).apply state



### [Forward imports](#state-function--forward-imports)

    RootState        = require './root-state'
    StateExpression  = require './state-expression'
