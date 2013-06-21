state owner,
  A:
    bang: ( arg1, arg2 ) -> # ...
    AA:
      bang: state.bind ->
        @owner is owner  # true
        @superstate.apply 'bang', arguments