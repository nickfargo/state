(function() {
  var Z, exec, fs, list, path;

  exec = require('child_process').exec;

  fs = require('fs.extra');

  path = require('path');

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
    var ext, lib, min, pub, url;
    lib = 'lib/';
    pub = '../state--gh-pages/';
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
        tasks: 'concat lint min qunit publish docco'
      },
      server: {
        port: 8000,
        base: '..'
      },
      qunit: {
        files: 'test/**/*.html'
      }
    });
    grunt.registerTask('publish', '', function() {
      var check, copy, files;
      files = ["state" + ext, "state" + min + ext];
      check = function() {
        var cont, file, incr, n, _i, _len;
        n = files.length;
        incr = function(err) {
          if (!--n) return cont(err);
        };
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          file = pub + file;
          path.exists(file, (function(file) {
            return function(exists) {
              if (exists) {
                return fs.unlink(file, incr);
              } else {
                return incr();
              }
            };
          })(file));
        }
        return cont = copy;
      };
      copy = function(err) {
        var cont, file, incr, n, _i, _len;
        n = files.length;
        incr = function(err) {
          if (!--n) return cont(err);
        };
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          fs.copy(file, pub + file, incr);
        }
        return cont = function() {};
      };
      return check();
    });
    grunt.registerTask('docco', '', function() {
      var docco, mkdir, move, rmdir;
      docco = function() {
        return exec('docco state.js', mkdir);
      };
      mkdir = function(err) {
        return fs.mkdir(pub + 'source', move);
      };
      move = function(err) {
        var cont, incr, k, map, n, v;
        map = {
          "docs/state.html": pub + "source/index.html",
          "docs/docco.css": pub + "source/docco.css"
        };
        n = 0;
        incr = function(err) {
          if (err) {
            return --n;
          } else {
            if (++n === 2) return cont(err);
          }
        };
        for (k in map) {
          v = map[k];
          fs.rename(k, v, incr);
        }
        return cont = rmdir;
      };
      rmdir = function(err) {
        return fs.rmdir('docs');
      };
      return docco();
    });
    return grunt.registerTask('default', 'server concat lint min qunit publish docco watch');
  };

}).call(this);
