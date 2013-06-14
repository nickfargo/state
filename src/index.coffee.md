Copyright (C) 2011-2013 Nick Fargo. License MIT.

**State** implements state-driven behavior directly into JavaScript objects.
> [statejs.org](/)
> [blog](/blog/)
> [docs](/docs/)
> [api](/api/)
> [tests](/tests/)
> <a class="icon-invertocat" href="http://github.com/nickfargo/state"></a>



## index

    exports = ->
      @State                = require './state'
      @StateExpression      = require './state-expression'
      @RootState            = require './root-state'
      @Transition           = require './transition'
      @TransitionExpression = require './transition-expression'

    exports.apply module.exports = require './state-function'

