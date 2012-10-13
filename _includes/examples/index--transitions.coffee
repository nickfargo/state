class ContainerView
  state @::, 'abstract'
    Grid: state 'default initial'
    List: state

    transitions:
      GridToList:
        origin: 'Grid', target: 'List'
        action: ( args... ) ->
          # Rearrange subviews into a vertical column
          # Change states of the subviews, if applicable
          # Load model data as appropriate for this state
          @end()

      ListToGrid:
        origin: 'List', target: 'Grid'
        action: ( args... ) ->
          # ...
          @end()