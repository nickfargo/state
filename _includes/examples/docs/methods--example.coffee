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
    freeze: ->                                              # [3]
      result = @call 'save'                                 # [4]
      @change 'Frozen'
      result

    Dirty:
      save: ->
        owner = @owner()
        args = [ owner.location(), owner.read() ]
        @change 'Saved', args                               # [5]
        owner
    
    Saved: state 'initial'
      edit: ->
        result = @superstate().apply 'edit', arguments      # [2]
        @change 'Dirty'
        result

      Frozen: state 'final'
        edit: ->
        freeze: ->

    transitions:
      Writing:
        origin: 'Dirty', target: 'Saved'
        action: ( location, text ) ->
          fs.writeFile location, text, ( err ) =>
            return @abort( err ).change('Dirty') and this if err
            do @end