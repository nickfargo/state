    state = require './state-function'

    module.exports =



## [StateContent](#state-content)

    class StateContent

      { useDispatchTables } = state.options

      constructor: ->
        @data         = null
        @methods      = null
        @events       = null
        @guards       = null
        @substates    = null
        @transitions  = null

        @__dispatch_table__ = null if useDispatchTables
