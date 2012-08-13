mover = {}
state mover,
  construct: ( expression ) ->
    console.log "root state constructed"
  
  Moving:
    construct: ( expression ) ->
      console.log "State '#{ @name() }' constructed"
    
    Walking:
      construct: ( expression ) ->
        console.log "State '#{ @name() }' constructed"

# log <<< State 'Walking' constructed
# log <<< State 'Moving' constructed
# log <<< root state constructed