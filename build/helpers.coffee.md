    list = ( items ) ->
      if Array.isArray items then items else items.split /\s*?\n+\s*/

    prefix = ( pre, items ) ->
      pre + v for v, i in list items

    postfix = ( post, items ) ->
      v + post for v, i in list items

    affix = ( pre, post, items ) ->
      prefix pre, postfix post, list items

    use = ( grunt ) ->
      load: ( items ) ->
        rx = /^[\.\/\\]/
        for item in list items
          method = if rx.test item then 'loadTasks' else 'loadNpmTasks'
          grunt[ method ] item

      config: -> grunt.initConfig.apply grunt, arguments
      task: -> grunt.registerTask.apply grunt, arguments
      multiTask: -> grunt.registerMultiTask.apply grunt, arguments


    module.exports = {
      list
      prefix
      postfix
      affix
      use
    }
