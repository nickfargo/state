// Generated by CoffeeScript 1.6.3
(function() {
  var O, RootState, State, bind, env, expect, state,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  expect = require('chai').expect;

  state = require('state');

  O = state.O, env = state.env, State = state.State, RootState = state.RootState, bind = state.bind;

  describe("Events:", function() {
    describe("Context and arguments", function() {
      var fix;
      bind = state.bind, fix = state.fix;
      it("converts raw arguments to an array", function() {
        var o;
        state(o = {}, {
          A: state({
            enter: function(transition, args) {
              return expect(args.join(' ')).to.equal("one two three");
            }
          })
        });
        return (function(a, b, c) {
          return o.state('-> A', arguments);
        })('one', 'two', 'three');
      });
      (function() {
        var o;
        state(o = {}, {
          A: state({
            enter: function(transition, args) {
              var currentState,
                _this = this;
              currentState = this.state();
              it("binds context to the owner", function() {
                return expect(_this).to.equal(o);
              });
              return it("provides correct arguments to transition and args params", function() {
                expect(transition).to.equal(currentState);
                return expect(args.join(' ')).to.equal("one two three");
              });
            },
            exit: bind(function(transition, args) {
              var currentState,
                _this = this;
              currentState = this.current();
              it("binds context to the local state", function() {
                return expect(_this).to.equal(o.state('A'));
              });
              return it("provides correct arguments to transition and args params", function() {
                expect(transition).to.equal(currentState);
                return expect(args.join(' ')).to.equal("one two three");
              });
            })
          })
        });
        describe("with a normal function", function() {
          return o.state('-> A', ['one', 'two', 'three']);
        });
        return describe("with a state-bound function", function() {
          return o.state('->', ['one', 'two', 'three']);
        });
      })();
      return (function() {
        var Class, Subclass, instance, _ref;
        Class = (function() {
          function Class() {}

          state(Class.prototype, {
            A: state
          });

          return Class;

        })();
        Subclass = (function(_super) {
          __extends(Subclass, _super);

          function Subclass() {
            _ref = Subclass.__super__.constructor.apply(this, arguments);
            return _ref;
          }

          state(Subclass.prototype, {
            A: state({
              enter: fix(function(autostate, protostate) {
                return function(transition, args) {
                  var currentState,
                    _this = this;
                  currentState = this.state();
                  it("binds context for a state-fixed function to the instance", function() {
                    return expect(_this).to.equal(instance);
                  });
                  it("closes over the proper autostate and protostate", function() {
                    expect(autostate).to.equal(Subclass.prototype.state('A'));
                    return expect(protostate).to.equal(Class.prototype.state('A'));
                  });
                  return it("provides correct arguments to transition and args params", function() {
                    expect(transition).to.equal(currentState);
                    return expect(args.join(' ')).to.equal("one two three");
                  });
                };
              }),
              exit: fix(function(autostate, protostate) {
                return bind(function(transition, args) {
                  var currentState,
                    _this = this;
                  currentState = this.current();
                  it("binds context for a fixed-bound function to the state", function() {
                    expect(_this.isVirtual()).to.be.ok;
                    return expect(_this.protostate).to.equal(Subclass.prototype.state('A'));
                  });
                  it("closes over the proper autostate and protostate", function() {
                    expect(autostate).to.equal(Subclass.prototype.state('A'));
                    return expect(protostate).to.equal(Class.prototype.state('A'));
                  });
                  return it("provides correct arguments to transition and args params", function() {
                    expect(transition).to.equal(currentState);
                    return expect(args.join(' ')).to.equal("one two three");
                  });
                });
              })
            })
          });

          return Subclass;

        })(Class);
        instance = new Subclass;
        describe("with a state-fixed function", function() {
          return instance.state('-> A', ['one', 'two', 'three']);
        });
        return describe("with a fixed and bound function", function() {
          return instance.state('->', ['one', 'two', 'three']);
        });
      })();
    });
    describe("Delegation:", function() {
      var recordEvent, recordEventWithPrefix;
      recordEvent = function() {
        return this.owner.eventRecords.push(this.name);
      };
      recordEventWithPrefix = function(prefix) {
        if (prefix == null) {
          prefix = '';
        }
        return function() {
          return this.owner.eventRecords.push(prefix + this.name);
        };
      };
      it("emits events on behalf of a substate", function() {
        var o;
        o = {
          eventRecords: []
        };
        state(o, {
          A: state('initial'),
          B: state
        });
        o.state('').on('enter', bind(recordEvent));
        o.state('').on(':enter', bind(recordEvent));
        o.state('').on('B:enter', bind(recordEvent));
        o.state('A').on('..B:enter', bind(recordEvent));
        o.state('-> B');
        expect(o.eventRecords).to.have.length(1);
        return expect(o.eventRecords[0]).to.equal('B');
      });
      it("can be expressed as a structured `StateExpression`", function() {
        var o;
        o = {
          eventRecords: []
        };
        state(o, {
          A: state('initial'),
          B: state,
          events: {
            enter: bind(recordEvent),
            ':enter': bind(recordEvent),
            'B:enter': bind(recordEvent)
          }
        });
        o.state('-> B');
        expect(o.eventRecords).to.have.length(1);
        return expect(o.eventRecords[0]).to.equal('B');
      });
      it("can be expressed as a shorthand `StateExpression`", function() {
        var o;
        o = {
          eventRecords: []
        };
        state(o, {
          A: state('initial'),
          B: state,
          enter: bind(recordEvent),
          ':enter': bind(recordEvent),
          'B:enter': bind(recordEvent)
        });
        o.state('-> B');
        expect(o.eventRecords).to.have.length(1);
        return expect(o.eventRecords[0]).to.equal('B');
      });
      it("traverses the protostate–epistate relation", function() {
        var Class, Superclass, o, _ref;
        Superclass = (function() {
          function Superclass() {
            this.eventRecords = [];
          }

          state(Superclass.prototype, {
            A: state('initial'),
            B: state,
            enter: bind(recordEvent),
            ':enter': bind(recordEvent),
            'B:enter': bind(recordEvent)
          });

          return Superclass;

        })();
        Class = (function(_super) {
          __extends(Class, _super);

          function Class() {
            _ref = Class.__super__.constructor.apply(this, arguments);
            return _ref;
          }

          return Class;

        })(Superclass);
        o = new Class;
        o.state('-> B');
        expect(o.eventRecords).to.have.length(1);
        return expect(o.eventRecords[0]).to.equal('B');
      });
      it("emits events on behalf of arbitrary substates", function() {
        var Class, Superclass, o, _ref;
        Superclass = (function() {
          function Superclass() {
            this.eventRecords = [];
          }

          state(Superclass.prototype, {
            A: state('initial'),
            B: state,
            '*:enter': bind(recordEvent)
          });

          return Superclass;

        })();
        Class = (function(_super) {
          __extends(Class, _super);

          function Class() {
            _ref = Class.__super__.constructor.apply(this, arguments);
            return _ref;
          }

          return Class;

        })(Superclass);
        o = new Class;
        o.state('-> B');
        o.state('-> A');
        o.state('-> B');
        return expect(o.eventRecords.join(' ')).to.equal("B A B");
      });
      it("emits events on behalf of arbitrary substate descendants", function() {
        var Class, Superclass, o, _ref;
        Superclass = (function() {
          function Superclass() {
            this.eventRecords = [];
          }

          state(Superclass.prototype, {
            A: state('initial', {
              AA: state
            }),
            B: state({
              BA: state,
              BB: state({
                BBA: state
              })
            }),
            '**:enter': bind(recordEvent)
          });

          return Superclass;

        })();
        Class = (function(_super) {
          __extends(Class, _super);

          function Class() {
            _ref = Class.__super__.constructor.apply(this, arguments);
            return _ref;
          }

          state(Class.prototype, {
            'B.***:enter': bind(recordEventWithPrefix('^')),
            C: state
          });

          return Class;

        })(Superclass);
        o = new Class;
        o.state('-> AA');
        o.state('-> BA');
        o.state('-> BBA');
        o.state('-> C');
        return expect(o.eventRecords.join(' ')).to.equal("AA\n^B B ^BA BA\n^BB BB ^BBA BBA\nC".split('\n').join(' '));
      });
      return it("emits delegated events inherited via parastate and superstate", function() {
        var Class, Superclass, o, _ref;
        Superclass = (function() {
          function Superclass() {
            this.eventRecords = [];
          }

          state(Superclass.prototype, 'abstract', {
            A: state('abstract', {
              '*:enter': bind(recordEventWithPrefix('(A)'))
            }),
            B: state('abstract', {
              '**:enter': bind(recordEventWithPrefix('(B)'))
            })
          });

          return Superclass;

        })();
        Class = (function(_super) {
          __extends(Class, _super);

          function Class() {
            _ref = Class.__super__.constructor.apply(this, arguments);
            return _ref;
          }

          state(Class.prototype, {
            '**:enter': bind(recordEvent),
            C: state.extend('A, B', 'default', {
              CA: state({
                CAA: state,
                CAB: state
              }),
              CB: state
            }),
            D: state.extend('B, A')
          });

          return Class;

        })(Superclass);
        o = new Class;
        o.state('-> CAA');
        o.state('-> D');
        o.state('-> CAB');
        return expect(o.eventRecords.join(' ')).to.equal("(B)CA CA (B)CAA CAA\n(B)D (A)D D\n(A)C (B)C C (B)CA CA (B)CAB CAB".split('\n').join(' '));
      });
    });
    describe("Each transitional event (`depart`, `exit`, `enter`, `arrive`)", function() {
      var addEvents, callback, log, unit;
      callback = function(e) {
        return function(transition, args) {
          return this.log("" + transition.superstate.name + ":" + e);
        };
      };
      addEvents = function(root, callbackFactory) {
        var e, name, s, _ref, _results;
        if (callbackFactory == null) {
          callbackFactory = callback;
        }
        _ref = root.descendants(null, {
          '': root
        });
        _results = [];
        for (name in _ref) {
          s = _ref[name];
          _results.push((function() {
            var _i, _len, _ref1, _results1;
            _ref1 = ['depart', 'exit', 'enter', 'arrive'];
            _results1 = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              e = _ref1[_i];
              _results1.push(s.on(e, callbackFactory(e)));
            }
            return _results1;
          })());
        }
        return _results;
      };
      log = function(value) {
        this.store.push(value);
        return value;
      };
      unit = {
        expression: state({
          A: state('initial'),
          B: state({
            BA: state,
            BB: state
          })
        }),
        traverse: function(o) {
          o.state('->');
          o.state('-> B');
          o.state('-> BA');
          return o.state('-> BB');
        },
        expectation: "A:depart\nA:exit\n:arrive\n:depart\nB:enter\nB:arrive\nB:depart\nBA:enter\nBA:arrive\nBA:depart\nBA:exit\nBB:enter\nBB:arrive"
      };
      it("is emitted properly from an object’s own state tree", function() {
        var o;
        o = {
          store: [],
          log: log
        };
        state(o, unit.expression);
        addEvents(o.state(''));
        unit.traverse(o);
        return expect(o.store.join('\n')).to.equal(unit.expectation);
      });
      return it("is emitted properly via prototype", function() {
        var Class, o;
        Class = (function() {
          function Class() {
            this.store = [];
          }

          Class.prototype.log = log;

          state(Class.prototype, unit.expression);

          addEvents(Class.prototype.state(''));

          return Class;

        })();
        state(o = new Class);
        unit.traverse(o);
        return expect(o.store.join('\n')).to.equal(unit.expectation);
      });
    });
    describe("Each existential event (`construct`, `destroy`)", function() {});
    return describe("The `mutate` event", function() {});
  });

}).call(this);
