    state = require './state-function'

    module.exports =



## [StateMetaobject](#state-metaobject)

    class StateMetaobject

      { useDispatchTables } = state.options

      constructor: ->

The host state’s `parastates` are stored here as a string array of paths to
**parastates** from which the state inherits along with the state’s
**superstate**.

        @parastates     = null

The host `State`s intrinsic contents.

        @data           = null
        @methods        = null
        @events         = null
        @guards         = null
        @substates      = null
        @transitions    = null

If enabled, a dispatch table may be used to cache method resolutions.

        @__dispatch_table__ = null if useDispatchTables
