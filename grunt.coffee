{ exec } = require 'child_process'
fs       = require 'fs'
util     = require 'util'
O        = require '../omicron/omicron'

tasks = "concat lint min qunit publish docco"

list = ( pre, post, items ) ->
  items[i] = pre + v + post for v, i in items.split /\s*?\n+\s*/

fs.copy = ( source, target, callback ) ->
  fs.stat target, ( err ) ->
    return callback new Error "#{target} exists" unless err
    fs.stat source, ( err ) ->
      return callback err if err
      read = fs.createReadStream source
      write = fs.createWriteStream target
      util.pump read, write, callback

module.exports = ( grunt ) ->
  lib = 'lib/'
  pub = '../state--gh-pages/'
  min = '-min'
  ext = '.js'

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
          state-event-emitter
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

    lint:
      target: '<config:concat.js.dest>'

    jshint:
      options: O.assign( """
        eqeqeq immed latedef noarg undef
        boss eqnull expr shadow sub supernew multistr validthis laxbreak
        """, true )
      globals: O.assign( 'module exports require O state', true )

    watch:
      files: '<config:concat.js.src>'
      tasks: tasks

    server:
      port: 8000
      base: '..'

    qunit:
      files: 'test/**/*.html'

  grunt.registerTask 'publish', '', ->
    files = list '', ext, """
      state
      state#{min}
    """

    clearOldFiles = ->
      n = files.length
      incr = ( err ) -> continuation err unless --n
      for file in files
        file = pub + file
        fs.exists file, do ( file ) -> ( exists ) ->
          if exists then fs.unlink file, incr else do incr
      continuation = copy

    copyModules = ( err ) ->
      continuation = copy

    copy = ( err ) ->
      n = files.length
      incr = ( err ) -> continuation err unless --n
      fs.copy file, pub + file, incr for file in files
      continuation = ->

    do clearOldFiles

  grunt.registerTask 'docco', '', ->
    docco = ->
      exec 'docco state.js', mkdir

    mkdir = ( err ) ->
      fs.mkdir pub + 'source', move

    move = ( err ) ->
      map =
        "docs/state.html" : pub + "source/index.html"
        "docs/docco.css"  : pub + "source/docco.css"
      n = 0
      incr = ( err ) -> if err then --n else continuation err if ++n is 2
      fs.rename k, v, incr for k,v of map
      continuation = rmdir

    rmdir = ( err ) ->
      fs.rmdir 'docs'

    do docco

  grunt.registerTask 'cleanup', '', ->
    logError = ( err ) -> console.log err if err
    fs.unlink 'grunt.js', logError

  grunt.registerTask 'default',
    "server #{tasks} cleanup watch"
