## [TransitionExpression](#transition-expression)

A `State` may hold **transition expressions** that describe a transition that
may take place between any two given **origin** and **target** states.

    class TransitionExpression
      properties   = O.assign TRANSITION_PROPERTIES, null
      categories   = O.assign TRANSITION_EXPRESSION_CATEGORIES, null
      eventTypes   = O.assign TRANSITION_EVENT_TYPES
      guardActions = O.assign GUARD_ACTIONS

### [Constructor](#transition-expression--constructor)

      constructor: ( map ) ->
        map = interpret map unless map instanceof TransitionExpression
        O.edit 'deep all', this, map


### [Class-private functions](#transition-expression--private)


#### [interpret](#transition-expression--private--interpret)

Rewrites a plain object as a well-formed `TransitionExpression`, making the
appropriate type inferences for any shorthand notation encountered.

      interpret = ( map ) ->
        result = O.assign {}, properties, categories

        for own key, value of map
          if key of properties
            result[ key ] = value
          else if key of categories
            result[ key ] = O.clone result[ key ], value
          else
            category =
              if key of eventTypes
                'events'
              else if key of guardActions
                'guards'
              else if typeof value is 'functions'
                'methods'
            if category
              item = result[ category ]
              item or = result[ category ] = {}
              item[ key ] = value

        for key, value of events = result.events
          events[ key ] = [ value ] if typeof value is 'function'

        result
