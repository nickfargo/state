    fs       = require 'fs'
    path     = require 'path'
    { exec } = require 'child_process'

    { postfix } = require '../helpers'


    module.exports = ( grunt ) ->

      @registerMultiTask 'docco', "", ->
        done = @async()

        commands = @files.map ({ src, dest, template }) ->
          command = ['node_modules/docco/bin/docco']
          command.push "#{ src.join ' ' }" if src?
          command.push "--output #{ dest }" if dest?
          command.push "--template #{ template }" if template?
          command.join ' '

        exec commands.join(' && '), ( error, stdout, stderr ) ->
          done if error? then error else stdout.toString()

For each source file, create a front-mattered `/source/<filename>.md`
that `include`s its generated html.

> _includes/content/source/full/index.coffee.md -> source/index.html

        @files.map ({ src, dest, markdown }) ->
          return unless markdown
          markdown = path.resolve markdown
          dest = /_includes\/(.*)/.exec( dest )[1]

          rtrim = ( str ) -> /(.*?)(?:\.coffee.md)?$/.exec( str )[1]

          src.map ( file ) ->
            file = rtrim /^src\/(.*)/.exec( file )[1]
            include = rtrim path.join dest, file
            target = path.join markdown, "#{file}.md"

            fs.writeFileSync target, """
            ---
            layout: source
            title: #{ file } - Source - State.js
            ---

            <div>{% include #{ include }.coffee.html %}</div>
            """
