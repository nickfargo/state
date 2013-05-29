## [StateContent](#state-content)

    State::Content = class StateContent

      constructor: ->
        @data         = null
        @methods      = null
        @events       = null
        @guards       = null
        @substates    = null
        @transitions  = null

        @__dispatch_table__ = null
