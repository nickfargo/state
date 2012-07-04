{ exec } = require 'child_process'
fs       = require 'fs.extra'
path     = require 'path'
Z        = require '../zcore/zcore'

list = ( pre, post, items ) ->
  items[i] = pre + v + post for v, i in items.split /\s+/

module.exports = ( grunt ) ->
  lib = 'lib/'
  pub = '../state--gh-pages/'
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
      options: Z.assign( """
        eqeqeq immed latedef noarg undef
        boss eqnull expr shadow sub supernew multistr validthis laxbreak
        """, true )
      globals: Z.assign( 'module exports require Z state', true )

    watch:
      files: '<config:concat.js.src>'
      tasks: 'concat min lint qunit publish docco'

    server:
      port: 8000
      base: '..'

    qunit:
      files: 'test/**/*.html'

  grunt.registerTask 'publish', '', ->
    files = [ "state#{ext}", "state#{min}#{ext}" ]

    check = ->
      n = files.length
      incr = ( err ) -> cont err unless --n
      for file in files
        file = pub + file
        path.exists file, do ( file ) -> ( exists ) ->
          if exists then fs.unlink file, incr else do incr
      cont = copy

    copy = ( err ) ->
      n = files.length
      incr = ( err ) -> cont err unless --n
      fs.copy file, pub + file, incr for file in files
      cont = ->

    do check

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
      incr = ( err ) -> if err then --n else cont err if ++n is 2
      fs.rename k, v, incr for k,v of map
      cont = rmdir

    rmdir = ( err ) ->
      fs.rmdir 'docs'

    do docco

  grunt.registerTask 'default',
    'server concat min lint qunit publish docco watch'
