    O                     = require 'omicron'
    state                 = require './state-function'
    Region                = require './region'

    module.exports =



## [RootState](#root-state)

A **root state** is the **owner**’s top-level `Region` and `State`, and is
enclosed by the owner’s **accessor** method.

    class RootState extends Region

      { rxTransitionArrow, transitionArrowMethods } = state
      { env, hasOwn } = O
      { slice } = Array::


### [Constructor](#root-state--constructor)

Creates a working **state tree** based on a single **root state** as directed
by an `expression`, and implements this tree as a behavior model for the
provided `owner`.

###### PARAMETERS

* `owner` : object

* `accessorName` : string — The property name on `owner` at which the generated
  **accessor** function will appear. Defaults to `'state'`.

* `expression` : ( object | `StateExpression` ) — A plain object will be
  coerced and interpreted, if necessary, into a formal `StateExpression`.

* `initialState` : string — A state name or path. If present, supersedes the
  `initial` attribute of substates or inherited protostates.

###### DISCUSSION

Direct construction via `new` is for internal use only; the `State` object
model is properly created by defining `StateExpression`s that are provided to
the exported `state` function.

###### SOURCE

      constructor: ( owner = {}, accessorName, expression, initialState ) ->

Assign to `owner` an **accessor** to its state implementation.

        @accessorName = accessorName ?= 'state'
        owner[ accessorName ] = createAccessor owner, accessorName, this

A root state’s `name` by definition is the empty-string.

        super owner, '', expression, initialState



### [Private functions](#root-state--private)


#### [createAccessor](#root-state--private--create-accessor)

Returns the `accessor` function that will serve as an owner object’s interface
to its state implementation.

      createAccessor = ( owner, name, root ) ->

        accessor = ( input, args... ) ->
          current = root._current or root

          if this is owner
            return current unless input?
            return current.change input.call this if typeof input is 'function'
            if typeof input is 'string' and
                ( match = input.match rxTransitionArrow ) and
                  method = transitionArrowMethods[ match[2] ]
              return if args.length
              then current[ method ].apply current, [ match[3] ].concat args
              else current[ method ] match[3]
            return current.query.apply current, arguments

Calling the accessor of a prototype means that `this` requires its own accessor
and root state. Creating a new `RootState` will have the desired side-effect of
also creating the object’s new accessor, to which the call is then forwarded.

          else if ( owner.isPrototypeOf this ) and
              ( ( not hasOwn.call this, name ) or @[ name ] is owner[ name ] )
            new RootState this, name, null, current.path()
            return @[ name ].apply this, arguments

        accessor.isAccessor = true

        if env.debug
          accessor.toString = ->
            "[accessor] -> #{ root._current.path() }"

        accessor
