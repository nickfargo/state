class Mover
  state @::

    # Use the root state’s `construct` event to programmatically
    # set up all of the states to log their transitional events.
    construct: ->
      events = ['depart', 'exit', 'enter', 'arrive']
      for s in [this].concat @substates true
        for e in events
          do ( s, e ) -> s.on e, -> console.log "#{e} #{@name()}"

    Stationary:
      Idle: state 'initial'
      Alert: state
    Moving:
      Walking: state
      Running:
        Sprinting: state


m = new Mover

m.state '-> Alert'
# log <<< "depart Idle"
# log <<< "exit Idle"
# log <<< "enter Alert"
# log <<< "arrive Alert"

m.state '-> Sprinting'
# log <<< "depart Alert"
# log <<< "exit Alert"
# log <<< "exit Stationary"
# log <<< "enter Moving"
# log <<< "enter Running"
# log <<< "enter Sprinting"
# log <<< "arrive Sprinting"