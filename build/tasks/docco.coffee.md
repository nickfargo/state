    fs      = require 'fs'
    docco   = require 'docco'
    helpers = require '../helpers'

    { postfix } = helpers


    module.exports = ( grunt ) ->

Generate annotated source HTML and copy to the `_includes` directory of
the project’s `gh-pages` branch.

      grunt.registerTask 'docco', "", ->

        targetDir = pub + '_includes/content/source'

        start = ->
          exec 'docco state.js -t build/source.jst', mkdir

        mkdir = ( err ) ->
          fs.exists targetDir, ( exists ) ->
            if exists then do move else fs.mkdir targetDir, move

        move = ( err ) ->
          console.error "docco move", err if err
          source = "docs/state.html"
          target = targetDir + "/index.html"

          fs.exists target, ( exists ) ->
            if exists then fs.unlink target, rename else do rename

          rename = -> fs.rename source, target, unlink

        unlink = ( err ) ->
          console.error "docco unlink", err if err
          fs.unlink 'docs/docco.css', rmdir

        rmdir = ( err ) ->
          console.error "docco rmdir", err if err
          fs.rmdir 'docs'

        do start
