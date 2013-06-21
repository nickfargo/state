fs = require 'fs'
state = require 'state'

class Document
  constructor: ( location, text ) ->
    @location = -> location
    @read = -> text
    @edit = ( newText ) ->                                  # [1]
      text = newText
      this

  state @::, 'abstract'
    freeze: state.bind ->                                   # [3]
      result = @call 'save'                                 # [4]
      @go 'Frozen'
      result

    Dirty:
      save: state.bind ->
        args = [ @owner.location(), @owner.read() ]
        @go 'Saved', args                                   # [5]
        owner

    Saved: state 'initial'
      edit: state.bind ->
        result = @superstate().apply 'edit', arguments      # [2]
        @go 'Dirty'
        result

      Frozen: state 'final'
        edit: ->
        freeze: ->

    transitions:
      Writing:
        origin: 'Dirty', target: 'Saved'
        action: state.bind ( location, text ) ->
          fs.writeFile location, text, ( err ) =>
            return @abort( err ).go('Dirty') and this if err
            do @end