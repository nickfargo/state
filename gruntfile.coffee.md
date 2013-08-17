# Gruntfile

    path = require 'path'

    helpers = require './build/helpers'

    { use, prefix, postfix, affix, list } = helpers



    module.exports = ( grunt ) ->

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

      ghPages = '../gh-pages/state/'

      config
        browserify:
          main:
            src: ['lib/']
            dest: ghPages

        concat: null

        coffee:
          main:
            options:
              sourceMap: yes
            src: 'src/'
            dest: 'lib/'

        uglify:
          options:
            report: 'gzip'

          main:
            src: 'state.js'
            dest: 'state-min.js'

        publish:
          src: postfix '.js', """
            state
            state-min
            ../omicron/omicron
            """
          dest: ghPages

        docco:
          content:
            src: 'src/*.coffee.md'
            dest: path.join ghPages, '_includes/content/source/content'
            template: 'build/source/content.jst'

          full:
            src: 'src/*.coffee.md'
            dest: path.join ghPages, '_includes/content/source/full'
            markdown: path.join ghPages, 'source'
            template: 'build/source/full.jst'

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
