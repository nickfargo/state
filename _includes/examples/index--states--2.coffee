owner.state '-> A'
owner.state() is stateA          # >>> true
owner.aMethod()                  # >>> "alpha"

owner.state '-> B'
owner.state() is stateB          # >>> true
owner.aMethod()                  # >>> "beta"

owner.state '->'
owner.state() is root            # >>> true
owner.aMethod()                  # >>> undefined

owner.state().owner is owner     # >>> true (invariant)
owner.state().root is root       # >>> true (invariant)
