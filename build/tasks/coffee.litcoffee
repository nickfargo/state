    coffee = require 'coffee-script'


    module.exports = (grunt) ->
      { _, linefeed } = grunt.util
      { forEach, extend } = _

      base = '/'

      defaultOptions =
        bare: no
        join: no
        sourceMap: no
        separator: linefeed

      rxExtension = /(?:\.coffee|\.litcoffee|\.coffee.md)$/
      rxLiterateExtension = /(?:\.litcoffee|\.coffee.md)$/

      log = -> console.log.apply console, arguments

      postamble = (dest) -> '\n' + """
        /*
        //@ sourceMappingURL=#{dest}
        */

        """

      noInputWarning = (path) ->
        grunt.log.warn "No input from '#{path}'."

      noOutputWarning = (path) ->
        grunt.log.warn "No output; file (#{path}) not created."

      filePartOf = (path) ->
        return null if grunt.file.isDir path
        /(?:.*\/|^)([^\/]*)/.exec( path )[1]

      dirPartOf = ( path, allowTrailingSlash = no ) ->
        path = /(.*\/|^)[^\/]*/.exec( path )[1] unless grunt.file.isDir path
        if allowTrailingSlash then path else path.replace /(.*)\/$/, '$1'



      grunt.registerMultiTask 'coffee', "", ->
        options = @options defaultOptions
        grunt.verbose.writeflags options, "Options"

        forEach @files, (file) ->
          return do noInputWarning unless file.src.length

If supplied `dest` must be a path to a directory.

          if file.dest then throw Error unless grunt.file.isDir file.dest

          forEach file.src, (src) ->
            log "src=#{src}"

            srcFile = filePartOf src
            destFile = srcFile.replace rxExtension, '.js'
            dest = ( file.dest or dirPartOf(src, yes) or '' ) + destFile
            literate = options.literate or rxLiterateExtension.test srcFile
            sourceMap = options.sourceMap
            sourceMap = dest.replace /\.js$/, '.map' if sourceMap is true

            source = grunt.file.read src
            return noInputWarning src unless source.length

            opts = extend {}, options, {
              literate
              generatedFile  : destFile
              sourceRoot     : ''
              sourceFiles    : [srcFile]
            }

            output = coffee.compile source, opts

            if sourceMap
              { v3SourceMap } = output
              output = output.js + postamble filePartOf sourceMap

            return noOutputWarning dest unless output.length

            grunt.file.write dest, output
            grunt.log.writeln "Source compiled to '#{dest}'."

            if sourceMap
              grunt.file.write sourceMap, v3SourceMap
              grunt.log.writeln "Source map '#{sourceMap}' created."

