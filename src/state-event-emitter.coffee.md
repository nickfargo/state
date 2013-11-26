    state = require './state-function'
    State = require './state'

    { O } = state

    module.exports =



## [StateEventEmitter](#state-event-emitter)

A `State` defines a `StateEventEmitter` for each of its event types.

For the purposes of `StateEventEmitter`s, a *callback* is normally a function,
but may also take the form of a string, which, when the client `state`
`emit`s the event type associated with `this` emitter, will be interpreted as
an implicit command for the emitting state to `change` to the *target* state
named by the string.

    class StateEventEmitter

      { isArray } = O

      guid = 0


### [Constructor](#state-event-emitter--constructor)

      constructor: ( @state ) ->
        @items = {}
        @length = 0



### [Methods](#state-event-emitter--methods)


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

      add: ( callback, context, selector ) ->
        id = guid += 1
        @items[ id ] =
          if context? or selector?
          then [ callback, context, selector ]
          else callback
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
provided `clientState`, while unbound callbacks are invoked in the context of
its `owner`.

      emit: ( args, clientState = @state, origin ) ->
        throw TypeError unless ( owner = clientState?.owner )?

        for own key, item of @items
          fn = context = selector = null

Interpret a string or `State` as an order to transition to the implicated
`State` after all the callbacks have been invoked.

          if typeof item is 'string' or item instanceof State
            eventualTarget = item
            continue

Extract the components of a listener that binds a `context` or `selector`.

          [ item, context, selector ] = item if isArray item

          if selector?
            if clientState.query selector, origin
              #throw new Error "HAHA"
            else
              console.log '\n' + """
              clientState: '#{clientState}' [#{clientState.owner.constructor.name}]
              selector: '#{selector}'
              origin: '#{origin}' [#{origin.owner.constructor.name}]
              virtual?: #{origin.isVirtual()}
              current?: #{origin.isCurrent()}
              equal?: #{clientState is origin}
              superstate?: #{clientState.isSuperstateOf origin}
              protostate?: #{clientState.isProtostateOf origin}
              query!!!: #{clientState.query(selector)}
              bingo?: #{clientState.query(selector).isProtostateOf origin}
              """

Listeners with an associated `selector` that does not match the `origin` state
from which this event was `emit`ted will be skipped.

          if selector?
          then continue unless clientState.query selector, origin
          else continue unless clientState is origin

Unbox any state-bound functions.

          if typeof item is 'function'
            fn = item
          else if item?.type is 'state-bound-function'
            { fn } = item
            context or = clientState

          fn.apply context or owner, args

        @state.change eventualTarget if eventualTarget

      @::trigger = @::emit


#### [destroy](#state-event-emitter--prototype--destroy)

      destroy: ->
        do @empty
        @state = @items = null
        true
