owner.state '-> A'
owner.state() is stateA          # >>> true

owner.state '-> B'
owner.state() is stateB          # >>> true

owner.state '->'
owner.state() is root            # >>> true

owner.state().owner is owner     # >>> true (invariant)
owner.state().root is root       # >>> true (invariant)
