list = ( pre, post, items ) ->
  items[i] = pre + v + post for v, i in items.split /\s+/

module.exports = ( grunt ) ->
  lib = 'lib/'
  min = '-min'
  ext = '.js'
  url = 'http://localhost:8000/test/'

  grunt.initConfig
    uglify: {}

    concat:
      js:
        src: list lib, ext, """
          __pre

          state/__pre
          state/constructor
          state/core
          state/internal
          state/virtualization
          state/expression
          state/mutation
          state/attributes
          state/model
          state/currency
          state/query
          state/data
          state/methods
          state/events
          state/guards
          state/substates
          state/transitions
          state/history
          state/__post

          state-expression
          state-controller
          state-event
          state-history
          state-concurrency
          transition
          transition-expression

          __post
          """
        dest: 'state' + ext
    
    min:
      js:
        src: '<config:concat.js.dest>'
        dest: 'state' + min + ext
    
    watch:
      files: '<config:concat.js.src>'
      tasks: 'concat min'

    server:
      port: 8000
      base: '..'

    qunit:
      all: list url, '.html', """
        index
        """

  grunt.registerTask 'default', 'concat min server watch'
