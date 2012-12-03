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
  pub = '../gh-pages/state/'
  min = '-min'
  ext = '.js'

  grunt.initConfig
    uglify: {}

    concat:
      js:
        src: list lib, ext, """
          __pre
          state-method

          state/__pre
          state/constructor
          state/core
          state/internal
          state/realization
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
          state/__post

          state-expression
          state-controller
          state-event-emitter
          transition
          transition-expression

          __post
          """
        dest: 'state' + ext

      tests:
        src: list 'test/unit/', '.test.js', """
          TestObject
          
          state-expression

          state/core
          state/virtualization
          state/expression
          state/mutation
          state/attributes
          state/model
          state/query
          state/data
          state/methods
          state/guards

          state-controller
          state-event
          state-method

          TextDocument
          """
        dest: 'test/tests' + ext

      publish_tests:
        src: '<config:concat.tests.dest>'
        dest: pub + 'tests/tests' + ext

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


  # Copy published source and related bits to gh-pages
  grunt.registerTask 'publish', '', ->
    files = list '', ext, """
      state
      state#{min}
      ./node_modules/omicron/omicron
    """

    copyFiles = ->
      n = files.length
      increment = ( err ) -> continuation err unless --n
      for source in files
        target = pub + source.replace /.*\/(.*)$/, "$1"
        fs.exists target, do ( source, target ) -> ( exists ) ->
          console.log "publish: #{source} > #{target}"
          copy = ( err ) ->
            console.error "publish:", err if err
            fs.copy source, target, increment
          if exists then fs.unlink target, copy else do copy
      continuation = ->

    do copyFiles


  # Generate annotated source HTML and copy to includes dir of gh-pages
  grunt.registerTask 'docco', '', ->
    targetDir = pub + '_includes/content/source'

    docco = ->
      exec 'docco state.js -t build/source.jst', mkdir

    mkdir = ( err ) ->
      fs.exists targetDir, ( exists ) ->
        if exists then do move else fs.mkdir targetDir, move

    move = ( err ) ->
      console.error "docco:move", err if err
      source = "docs/state.html"
      target = targetDir + "/index.html"

      fs.exists target, ( exists ) ->
        if exists then fs.unlink target, rename else do rename
      
      rename = -> fs.rename source, target, unlink

    unlink = ( err ) ->
      console.error "docco:unlink", err if err
      fs.unlink 'docs/docco.css', rmdir

    rmdir = ( err ) ->
      console.error "docco:rmdir", err if err
      fs.rmdir 'docs'

    do docco


  grunt.registerTask 'cleanup', '', ->
    logError = ( err ) -> console.error "cleanup", err if err
    fs.unlink 'grunt.js', logError
    process.nextTick -> console.log "\n"


  grunt.registerTask 'default',
    "server #{tasks} cleanup watch"
