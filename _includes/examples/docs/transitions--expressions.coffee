# An asynchronous logger
log = ( message, callback ) -> # ...

class Foo
  state @::, 'abstract',
    Bar: state 'default initial'
    Baz:
      transitions:
        Zig: action: ->
          log "BLEEP", => @end()

    transitions:
      Zig: origin: 'Bar', target: 'Baz', action: ->
        log "bleep", => @end()
      Zag: origin: 'Baz', target: 'Bar', action: ->
        log "blorp", => @end()

foo = new Foo

zig = ->
  foo.state()               # >>> State 'Bar'
  foo.state '-> Baz'        # (enacts `Zig` of `Baz`)
  transition = foo.state()  # >>> Transition 'Zig'
  transition.on 'end', zag

zag = ->
  foo.state()               # >>> State 'Baz'
  foo.state '-> Bar'        # (enacts `Zag` of root state)
  transition = foo.state()  # >>> Transition 'Zag'
  transition.on 'end', stop

stop = -> "take a bow"

do zig
# ...
# log <<< "BLEEP"
# ...
# log <<< "blorp"