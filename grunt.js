(function() {
  var Z, list;

  Z = require('../zcore/zcore');

  list = function(pre, post, items) {
    var i, v, _len, _ref, _results;
    _ref = items.split(/\s+/);
    _results = [];
    for (i = 0, _len = _ref.length; i < _len; i++) {
      v = _ref[i];
      _results.push(items[i] = pre + v + post);
    }
    return _results;
  };

  module.exports = function(grunt) {
    var ext, lib, min, url;
    lib = 'lib/';
    min = '-min';
    ext = '.js';
    url = 'http://localhost:8000/test/';
    grunt.initConfig({
      uglify: {},
      concat: {
        js: {
          src: list(lib, ext, "__pre\n\nstate/__pre\nstate/constructor\nstate/core\nstate/internal\nstate/virtualization\nstate/expression\nstate/mutation\nstate/attributes\nstate/model\nstate/currency\nstate/query\nstate/data\nstate/methods\nstate/events\nstate/guards\nstate/substates\nstate/transitions\nstate/history\nstate/__post\n\nstate-expression\nstate-controller\nstate-event-emitter\nstate-history\nstate-concurrency\ntransition\ntransition-expression\n\n__post"),
          dest: 'state' + ext
        }
      },
      min: {
        js: {
          src: '<config:concat.js.dest>',
          dest: 'state' + min + ext
        }
      },
      lint: {
        target: '<config:concat.js.dest>'
      },
      jshint: {
        options: Z.assign("eqeqeq immed latedef noarg undef\nboss eqnull expr shadow sub supernew multistr validthis laxbreak", true),
        globals: Z.assign('module exports require Z state', true)
      },
      watch: {
        files: '<config:concat.js.src>',
        tasks: 'concat min lint qunit docco'
      },
      server: {
        port: 8000,
        base: '..'
      },
      qunit: {
        files: 'test/**/*.html'
      }
    });
    grunt.registerTask('docco', '', function() {
      var docco, exec, fs, rename;
      exec = require('child_process').exec;
      fs = require('fs');
      docco = function() {
        return exec('docco state.js', rename);
      };
      rename = function(err, stdout, stderr) {
        fs.rename('docs/state.html', 'docs/source/index.html');
        return fs.rename('docs/docco.css', 'docs/source/docco.css');
      };
      return docco();
    });
    return grunt.registerTask('default', 'server concat min lint qunit docco watch');
  };

}).call(this);
