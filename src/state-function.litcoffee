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

> See also:
> [`State`][],
> [`STATE_ATTRIBUTES`][],
> [`StateExpression`][]

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

    state.bind = ( fn ) -> { type: 'state-bound-function', fn }


#### [state.fix](#state-function--fix)

Used inside a state expression, a combinator `fn` wrapped with `state.fix` will
be partially applied with a reference to `autostate`, the precise `State` to
which the combinator’s returned function will belong, and a reference to
`protostate`, the immediate **protostate** of `autostate`.

A method, event listener, etc. that is `fix`ed thusly has access to, and full
lexical awareness of, the particular `State` environment in which it exists.

* `fn` : ( autostate, protostate ) → ( any… ) → any

    state.fix = ( fn ) -> { type: 'state-fixed-function', fn }


#### [state.method](#state-function--method)

> Deprecate me

Returns a `factory`, nominally for internal use, which will flatten the scope
of the provided `fn`, reclose it both over any provided `bindings` and over a
set of `lexicals` based on `autostate`, which is provided to `factory` as the
`State` instance that will contain the **lexical state methods** that `factory`
produces.

Wrapping method functions with `state.method` inside a state expression is
useful particularly for exposing to the method body a correct reference to the
**protostate**, while also ensuring that the method is fully heritable by both
**substates** and **epistates** (inheritors of a protostate).

> [Lexical binding in state methods][]

> [`state.method`](/api/#state-function--method)

    state.method = do ->
      lexicals = ['__State__', 'autostate', 'protostate']

      pattern = ///^
        ( function
            \s*
          (?:[$_A-Za-z][$\w]*)?
            \s*
          \((?:[\s\S]*?)\)
            \s*
          \{
        )
        (\s\S]*)
      ///

      template = """
        return $1
          var superstate, owner;
          if ( this instanceof __State__ ) {
            superstate = this.superstate;
            owner = this.owner;
          }
        $2;
      """

      createMethod = ( factory, autostate, bindings, fn ) ->

Gather all the identifiers that the transformed `fn` will be closed over, and
arrange them into an array of named `params`.

        identifiers = if bindings? and ( typeof bindings is 'object' or
          typeof bindings is 'function' ) then O.keys bindings else []
        values = ( bindings[ id ] for id in identifiers )
        params = identifiers.concat lexicals

Gather all the values that will be mapped to the `params`.

        args = [ State, autostate, autostate.protostate() ]
        args = values.concat args if values.length

Write the body of the function that wraps `fn`, and inject `fn` with references
to the superstate and owner of the context `State`.

        body = Function::toString.call( fn ).replace pattern, template

Generate the wrapper function defined by `params` and `body`, and immediately
apply it with all of the closed binding values to produce the `method`.

        method = Function.apply( null, params.concat body ).apply( null, args )

Save the `factory` from which the method was created, so that the method can be
cloned or exported, e.g. by calling `express`, to a separate `State`, where the
method will need to be re-transformed with bindings to the environment of the
new state.

        method.factory = factory

        method.isLexicalStateMethod = true
        method


      return ( bindings, fn ) ->

        factory = ( autostate ) ->

Invocation from outside the module is forbidden, as this could expose
`bindings`, which must remain private.

          throw ReferenceError unless this is __MODULE__

With proper `bindings` and `fn` arguments, forward the invocation to
`createMethod`.

          if typeof bindings is 'object' and typeof fn is 'function'
            createMethod factory, autostate, bindings, fn

If passed `bindings` only, return a partially applied function that accepts
`fn` later.

          else if typeof bindings is 'object' and fn is undefined
            ( fn ) -> createMethod factory, autostate, bindings, fn

If passed only `fn` as the first argument, assume no `bindings`.

          else if typeof bindings is 'function' and fn is undefined
            createMethod factory, autostate, null, bindings

        factory.isLexicalStateMethodFactory = true
        factory



### Exports

The `state` module is exported via CommonJS on the server, and globally in the
browser.

    if O.env.server then module.exports = exports = state
    if O.env.client then global['state'] = state
