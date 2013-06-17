## Publish

Publishes the project’s compiled source files to the `gh-pages` branch.

    fs      = require 'fs'
    helpers = require '../helpers'

    { postfix } = helpers


    module.exports = ( grunt ) ->

      grunt.registerTask 'publish', "", ->

        copyFiles = ( path, files ) ->
          n = files.length

          increment = ( err ) -> continuation err unless --n

          for source in files
            target = path + source.replace /.*\/(.*)$/, "$1"

            fs.exists target, do ( source, target ) -> ( exists ) ->
              console.log "publish: #{source} > #{target}"

              copy = ( err ) ->
                console.error "publish:", err if err
                fs.copy source, target, increment

              if exists then fs.unlink target, copy
              else do copy

          continuation = ->


        copyFiles '../../../gh-pages/state/', postfix '.js', """
          state
          state#{min}
          ../omicron/omicron
          """
