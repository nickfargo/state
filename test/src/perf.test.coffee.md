    state = require '../..'

    log = -> console.log.apply console, arguments

    now = if performance?.now?
    then -> performance.now()
    else ->
      [ int, frac ] = process.hrtime()
      int + 1e-9 * frac


    0 and
    describe.only "Perf:", ->
      n = 1000
      results = creation: {}, invocation: {}

      do =>
        class Class
          m: -> 1

        t = now()
        for i in [0...n]
          o = new Class
        results.creation.stateless = now() - t

      do =>
        class Class

        t = now()
        for i in [0...n]
          state o = new Class, A: m: -> 1
        results.creation.stateful_ = now() - t

      do =>
        class Class
          state @::, A: m: -> 1

        t = now()
        for i in [0...n]
          o = new Class
          o.state()
        results.creation.inherited = now() - t


      do =>
        class Class
          m: -> 1

        o = new Class
        t = now()
        for i in [0...n]
          o.m()
        results.invocation.stateless = now() - t

      do =>
        class Class
          state @::, A: state 'initial', m: -> 1

        o = new Class
        t = now()
        for i in [0...n]
          o.m()
        results.invocation.inherited = now() - t

      do =>
        class Class
          state @::, A: state 'initial', m: -> 1

        o = new Class
        t = now()
        for i in [0...n]
          o.m()
        results.invocation.hotcode__ = now() - t

      do =>
        class Class
          state @::, A: state 'initial', m: -> 1

        o = new Class
        t = now()
        for i in [0...n]
          o.m()
        results.invocation.hotcode_2 = now() - t


      log results
