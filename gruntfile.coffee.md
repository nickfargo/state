# Gruntfile

    helpers = require './build/helpers'

    { use, prefix, postfix, affix, list } = helpers



    module.exports = (grunt) ->

Import a simplified set of functions for task declarations.

      { load, config, task } = use grunt


##### `loadTasks`/`loadNpmTasks`

      load './build/tasks'

      load prefix 'grunt-contrib-', """
        concat
        uglify
        connect
        """


##### `initConfig`

      ghPages = '/lab/gh-pages/restate/'

      config
        concat:
          options:
            separator: '\n\n\n\n'

          main:
            src: affix 'src/', '.coffee.md', """
              __prologue

              state-function

              state
              state-content
              state-expression
              state-event-emitter
              root-state
              transition
              transition-expression

              __epilogue
              __references
              """
            dest: './state.coffee.md'

    #      published_tests:


        coffee:
          main:
            options: sourceMap: yes
            src: 'state.coffee.md'

        uglify:
          options: report: 'gzip'

          main:
            src: 'state.js'
            dest: 'state-min.js'

          omicron:
            src: '../omicron/omicron.js'
            dest: 'omicron-min.js'

        publish:
          src: postfix '.js', """
            state
            state-min
            ../omicron/omicron
            """
          dest: ghPages

        docco:
          dest: ghPages

        connect:
          unit: {}

          tinker:
            options:
              base: '.'
              keepalive: true


##### `registerTask`

      task 'default', list """
        concat
        coffee
        uglify
        connect:unit
        """


`grunt tinker` keeps a live server for running tests in the browser.

      task 'tinker', list """
        concat
        coffee
        uglify
        connect:tinker
        """


      task 'compile', list """
        concat:main
        coffee:main
        """
