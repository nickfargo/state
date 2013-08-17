Copyright (C) 2011-2013 Nick Fargo. [License][] MIT.



## [index](#index)

    module.exports = state = require './state-function'

    exports = ->
      @State                = require './state'
      @StateExpression      = require './state-expression'
      @RootState            = require './root-state'
      @Transition           = require './transition'
      @TransitionExpression = require './transition-expression'

    exports.apply state



[License]: http://github.com/nickfargo/state/blob/master/LICENSE
