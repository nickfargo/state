## [StateEventEmitter](#state-event-emitter)

A `State` defines a `StateEventEmitter` for each of its event types.

For the purposes of `StateEventEmitter`s, a *callback* is normally a function,
but may also take the form of a string, which, when the client `state`
`emit`s the event type associated with `this` emitter, will be interpreted as
an implicit command for the emitting state to `change` to the *target* state
named by the string.

    class StateEventEmitter
      guid = 0


### [Constructor](#state-event-emitter--constructor)

      constructor: ( @state ) ->
        @items = {}
        @length = 0



### [Prototype methods](#state-event-emitter--prototype-methods)


#### [get](#state-event-emitter--prototype--get)

Retrieves a bound callback associated with the provided `id` as returned by
`add`.

      get: ( id ) ->
        @items[ id ]


#### [getAll](#state-event-emitter--prototype--get-all)

Returns an array of all callbacks bound to this emitter.

      getAll: ->
        value for own key, value of @items


#### [set](#state-event-emitter--prototype--set)

Adds or replaces a callback bound to a specific key.

  * `id` : string | number
  * `callback` : function | string

      set: ( id, callback ) ->
        { items } = this
        @length += 1 unless id of items
        items[ id ] = callback
        id


#### [key](#state-event-emitter--prototype--key)

Retrieves the `id` string associated with the bound `callback`.

      key: ( callback ) ->
        return key if value is callback for own key, value of @items


#### [keys](#state-event-emitter--prototype--keys)

Returns the set of `id` strings associated with all bound callbacks.

      keys: ->
        key for own key of @items


#### [add](#state-event-emitter--prototype--add)

Binds a callback and optional context object.

      add: ( callback, context ) ->
        id = guid += 1
        @items[ id ] = if context? then [ callback, context ] else callback
        @length += 1
        id

      @::on = @::bind = @::add


#### [remove](#state-event-emitter--prototype--remove)

Unbinds a callback, identified either by its numeric key or direct reference.

  * `id` : string | number | function

      remove: ( id ) ->
        { items } = this
        callback = items[ if typeof id is 'function' then @key id else id ]
        return no unless callback
        delete items[ id ]
        @length -= 1
        callback

      @::off = @::unbind = @::remove


#### [empty](#state-event-emitter--prototype--empty)

Removes all callbacks, and returns the number removed.

      empty: ->
        return 0 unless n = @length
        @items = {}
        @length = 0
        n


#### [emit](#state-event-emitter--prototype--emit)

Invokes all bound callbacks with the provided array of `args`. Callbacks
registered with an explicit context are invoked with that stored context.
Callbacks that are state-bound functions are invoked in the context of the
provided `autostate`, while unbound functions are invoked in the context of
its `owner`.

      emit: ( args, autostate = @state ) ->
        throw TypeError unless owner = autostate?.owner
        protostate = autostate.protostate()

        for own key, item of @items
          fn = context = null

Interpret a string or `State` as an order to transition to the implicated
`State` after all the callbacks have been invoked.

          if typeof item is 'string' or item instanceof State
            eventualTarget = item
            continue

          if typeof item is 'function' then fn = item
          else if O.isArray item then [ fn, context ] = item

Unbox any state-bound functions.

          else if item?.type is 'state-bound-function'
            { fn } = item
            context or = autostate

          fn.apply context or owner, args

        @state.change eventualTarget if eventualTarget

      @::trigger = @::emit


#### [destroy](#state-event-emitter--prototype--destroy)

      destroy: ->
        do @empty
        @state = @items = null
        true
