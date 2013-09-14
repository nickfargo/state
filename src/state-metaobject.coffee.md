    state = require './state-function'

    module.exports =



## [StateMetaobject](#state-metaobject)

    class StateMetaobject

      { useDispatchTables } = state.options

      constructor: ->

The host state’s `parastates` are a string array of paths to **parastates**
from which the state inherits. Along with the state’s **superstate**, this list
corresponds with the list of `State`s referenced at `linearization`, which
defines the monotonic resolution order for the inheritance exhibited by the
state within its state tree.

        @parastates     = null
        @linearization  = null

The host `State`s intrinsic contents.

        @data           = null
        @methods        = null
        @events         = null
        @guards         = null
        @substates      = null
        @transitions    = null

If enabled, a dispatch table may be used to cache method resolutions.

        @__dispatch_table__ = null if useDispatchTables
