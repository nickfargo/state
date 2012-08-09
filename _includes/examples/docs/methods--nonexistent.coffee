log = ( msg ) -> console.log msg
owner = {}

state owner, 'abstract'
  foo: -> log "I exist!"

  A: state 'default'
    bar: -> log "So do I!"
  B: state
# >>> State 'A'

root = owner.state ''
root.on 'noSuchMethod', ( methodName, args ) ->
  log "`owner` has no method '#{methodName}' in this state!"
root.on 'noSuchMethod:bar', ( args... ) ->
  log "Here’s another way to trap a bad call to 'bar'."

owner.foo()             # log <<< "I exist!"
owner.bar()             # log <<< "So do I!"
owner.state '-> B'      # State 'B'
owner.foo()             # log <<< "I exist!"
owner.bar()             # undefined
# log <<< "`owner` has no method 'bar' in this state!"
# log <<< "Here’s another way to trap a bad call to 'bar'."