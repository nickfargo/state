(function() {
  var list;

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
          src: list(lib, ext, "__pre\n\nstate/__pre\nstate/constructor\nstate/core\nstate/internal\nstate/virtualization\nstate/expression\nstate/mutation\nstate/attributes\nstate/model\nstate/currency\nstate/query\nstate/data\nstate/methods\nstate/events\nstate/guards\nstate/substates\nstate/transitions\nstate/history\nstate/__post\n\nstate-expression\nstate-controller\nstate-event\nstate-history\nstate-concurrency\ntransition\ntransition-expression\n\n__post"),
          dest: 'state' + ext
        }
      },
      min: {
        js: {
          src: '<config:concat.js.dest>',
          dest: 'state' + min + ext
        }
      },
      watch: {
        files: '<config:concat.js.src>',
        tasks: 'concat min'
      },
      server: {
        port: 8000,
        base: '..'
      },
      qunit: {
        all: list(url, '.html', "index")
      }
    });
    return grunt.registerTask('default', 'concat min server watch');
  };

}).call(this);
