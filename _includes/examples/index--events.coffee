class Mover
  state @::,
    Stationary:
      Idle: state 'initial'
      Alert: state
    Moving:
      Walking: state
      Running:
        Sprinting: state

    # Use the root state’s `construct` event to programmatically
    # set up all of the states to log their transitional events.
    construct: state.bind ->
      events = ['depart', 'exit', 'enter', 'arrive']
      for substate in [this].concat @substates true
        for event in events
          do ( substate, event ) ->
            substate.on event, state.bind ->
              console.log "#{event} #{@name}"


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