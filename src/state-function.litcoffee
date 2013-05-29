## [state()](#state-function)

> [`state()`](/api/#state-function)
> [The `state` function](/docs/#getting-started--the-state-function)

The `state` module is exported as a function. Invoking this function is the
primary point of entry into the module. It is used either to:

1. generate a formal `StateExpression`; or

2. bestow an arbitrary `owner` object with a state implementation, based on the
   application of the provided `expression` to a new `RootState` — and then
   return the owner’s initial `State`.

All arguments are optional. If only one `object`-typed argument is provided,
it is assigned to the `expression` parameter. If no `owner` is present,
`state()` returns a `StateExpression` based on the contents of `expression`
(and `attributes`). If both an `owner` and `expression` are present, `state`
acts in the second capacity, causing `owner` to become stateful.

The `attributes` argument may include any of the words defined in
`STATE_ATTRIBUTE_MODIFIERS`, which are encoded into the provided `expression`.

> See also: `STATE_ATTRIBUTES`

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



### Accessory properties


#### Metadata

Mix the project’s `meta` properties into the exported `state` function.

    O.assign state, meta



### Utility functions


#### [state.bind](#state-function--bind)

Used inside a state expression, a function `fn` wrapped with `state.bind` will
bind the context of `fn` either to any `State` created from that expression, or
when invoked for an object that inherits from the `owner` of the bound `State`,
to the corresponding **epistate** of that `State`.

Thusly bound methods, event listeners, etc., whose context would have normally
been the `owner`, still retain a reference thereto via `this.owner`.

* `fn` : ( any… ) → any

    state.bind = do ->
      bind = ( fn ) -> new StateBoundFunction fn
      bind.class = class StateBoundFunction
        type: 'state-bound-function'
        constructor: ( @fn ) ->
      bind


#### [state.fix](#state-function--fix)

Used inside a state expression, a `combinator` wrapped with `state.fix` will
be partially applied with a reference to `autostate`, the precise `State` to
which the combinator’s returned function will belong, and a reference to
`protostate`, the immediate **protostate** of `autostate`.

A method, event listener, etc. that is `fix`ed thusly has access to, and full
lexical awareness of, the particular `State` environment in which it exists.

* `fn` : ( autostate, protostate ) → ( any… ) → any

    state.fix = do ->
      fix = ( combinator ) -> new StateFixedFunction combinator
      fix.class = class StateFixedFunction
        type: 'state-fixed-function'
        constructor: ( @fn ) ->
      fix


### Exports

The `state` module is exported via CommonJS on the server, and globally in the
browser.

    if O.env.server then module.exports = exports = state
    if O.env.client then global['state'] = state
