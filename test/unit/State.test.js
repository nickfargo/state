1&&
( function ( $, assert, undefined ) {

( function () { module( "State.query" );

    test( "Aliases", function () {
        var s = state({},{});

        assert.ok(
            typeof s.query === 'function' &&
            s.query === s.match,
            "Alias `match` is provided."
        );
    });

    test( "Special cases", function () {
        var o = {};
        state( o, {
            A: {},
            B: {
                BA: {
                    BAA: {}
                },
                BB: {},
                BC: {
                    BCA: {},
                    BCB: {}
                }
            }
        });

        assert.ok(
            o.state( null ) === null &&
            o.state( undefined ) === null &&
            o.state().query( null, o.state('') ) === false &&
            o.state().query( null, "randomstring" ) === false &&
            o.state().query( null, null ) === false &&
            o.state().query( null, undefined ) === null,
            "Null selector returns null and matches nothing."
        );
        assert.ok(
            o.state('') === o.state().root() &&
            o.state('A').query('') === o.state().root(),
            "Empty string selector resolves to the root state."
        );
        assert.ok(
            Z.isEqual( o.state('*'), [ o.state('A'), o.state('B') ] ),
            "Absolute single-wildcard selector returns an array of the immediate substates."
        );
        assert.ok(
            Z.isEqual( o.state('**'), [
                o.state('A'),
                o.state('B'),
                o.state('BA'),
                o.state('BAA'),
                o.state('BB'),
                o.state('BC'),
                o.state('BCA'),
                o.state('BCB')
            ]),
            "Absolute double-wildcard selector returns a flattened depth-first array of all "+
            "descendants."
        );
        assert.ok(
             o.state().query( '*', o.state('') ) &&
             o.state().query( '*', o.state('B') ) &&
            !o.state().query( '*', o.state('BA') ),
            "Absolute single-wildcard selector matches the root state and its immediate "+
            "substates, but no further."
        );
        assert.ok(
            o.state().query( '**', o.state('') ) &&
            o.state().query( '**', o.state('B') ) &&
            o.state().query( '**', o.state('BA') ) &&
            o.state().query( '**', o.state('BAA') ),
            "Absolute double-wildcard selector matches any state in the tree."
        );
        assert.ok(
            !o.state().query( '.*', o.state('') ) &&
             o.state().query( '.*', o.state('B') ) &&
            !o.state().query( '.*', o.state('BA') ) &&
             o.state('B').query( '.*', o.state('BA') ) &&
            !o.state('B').query( '.*', o.state('BAA') ),
            "Relative single-wildcard selector matches the local state's immediate substates."
        );
    });

    test( "Disambiguation", function () {
        var o = {};
        state( o, {
            A: state( 'initial', {
                B: {},
                D: {
                    E: {}
                }
            }),
            B: {},
            C: {
                D: {},
                E: {}
            }
        });
        assert.ok(
            o.state('B').superstate() === o.state('') &&
            o.state('B').superstate() !== o.state('A'),
            "Absolute selector gives precedence to the higher-ranked state."
        );
        assert.ok(
            o.state('.B') === o.state('A.B') &&
            o.state('.B') !== o.state('B'),
            "Relative selector gives precedence to the descendant of the current state."
        );
        o.state().go('');
        assert.ok(
            o.state('.B') === o.state('B'),
            "Relative selector disambiguates differently as the current state changes."
        );
        assert.ok(
            o.state('.D').superstate() !== o.state('') &&
            o.state('.D') === o.state('A.D') &&
            o.state('.D') !== o.state('C.D'),
            "Relative selector with no local match is recursed to descendants."
        );
        assert.ok(
            o.state('.E') === o.state('C.E') &&
            o.state('.E') !== o.state('A.D.E'),
            "Relative selector with no local match recursively descends breadth-first."
        );
        o.state().go('A');
        assert.ok(
            o.state('.C').superstate() === o.state(''),
            "Relative selector with no local or descendant match is recursed to the superstate."
        );
    });

    test( "Resolution across ambiguously named nested states", function () {
        var o = {};
        state( o, {
            A: {
                A: {
                    A: {
                        A: {}
                    }
                }
            }
        });

        assert.ok(
            o.state('A').query('.A') === o.state('A.A') &&
            o.state('A.A').query('.A') === o.state('A.A.A') &&
            o.state('A.A.A').query('.A') === o.state('A.A.A.A') &&
            o.state('A.A.A.A').query('.A') === o.state('A.A.A.A') &&
            o.state('A.A.A.A').query('.A.A') === o.state('A.A.A.A') &&
            o.state('A.A.A').query('.A.A') === o.state('A.A.A.A') &&
            o.state('A.A').query('.A.A') === o.state('A.A.A.A') &&
            o.state('A').query('.A.A') === o.state('A.A.A'),
            ""
        );
    });

    test( "Additional mock tests", function () {
        var x = new TestObject;
        assert.ok( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ) );
        assert.ok( x.state().query( 'Finished.*', x.state('Finished.Terminated') ) );
        assert.ok( !x.state().query( 'Finished.*', x.state('Waiting') ) );
        assert.ok( !x.state().query( 'Finished.*', x.state('Finished') ) );
        assert.ok( x.state('Finished').query( '.Terminated', x.state('Finished.Terminated') ) );
        assert.ok( x.state('Finished').query( '.*', x.state('Finished.CleaningUp') ) );
        assert.ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
        assert.ok( x.state().query( '*', x.state('Finished') ) );
        assert.ok( !x.state().query( '*', x.state('Finished.Terminated') ) );
        assert.ok( x.state().query( '**', x.state('Finished.Terminated') ) );
        assert.ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
        assert.ok( x.state('Finished').query( '.**', x.state('Finished.Terminated') ) );

        assert.strictEqual( x.state().query( 'Finished' ), x.state('Finished') );
        assert.strictEqual( x.state().query( '*' ).length, 3 );
        assert.strictEqual( x.state().query( '**' ).length, 8 );
        assert.strictEqual( x.state('Finished').query( '.Terminated' ), x.state('Finished.Terminated') );
        assert.strictEqual( x.state('Finished').query( '.*' ).length, 2 );
        assert.strictEqual( x.state().query( '*', x.state('Finished') ), true );
        assert.strictEqual( x.state().query( '*', x.state('Finished.CleaningUp') ), false );
        assert.strictEqual( x.state().query( '**', x.state('Finished.CleaningUp') ), true );
        assert.strictEqual( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ), true );
        assert.strictEqual( x.state().query( 'Finished.*', x.state('Finished.Terminated') ), true );

        x.state().go('Waiting');
        assert.ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
        assert.ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
        x.state().go('');
        assert.ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
        assert.ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
        x.state().go('Tweaked');
    });
})();

( function () { module( "State.superstate" );
    function Mock () {
        state( this, {
            A: {
                A: {
                    A: {
                        A: {}
                    }
                },
                B: {}
            },
            B: {
                C: {
                    D: {}
                }
            }
        });
    }

    test( "Common usage", function () {
        var o = new Mock;

        assert.ok(
            o.state('A.A.A').superstate() === o.state('A.A'),
            "Calling `superstate` with no arguments returns the immediate superstate."
        );
    });

    test( "Special cases", function () {
        var o = new Mock;

        assert.ok(
            o.state('').superstate() === undefined,
            "Calling from the root state returns `undefined`."
        );
        assert.ok(
            o.state('D').superstate('*') === undefined,
            "Calling with a nonsensical argument returns `undefined`."
        );
    });

    test( "Resolution of named ancestor argument", function () {
        var o = new Mock;

        assert.ok(
            o.state('A.A.A').superstate('') === o.state(''),
            "Empty string resolves to the root state."
        );
        assert.ok(
            o.state('A.A.A').superstate('A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A') !== o.state('A'),
            "Ambiguous name resolves to the nearest ancestor."
        );
        assert.ok(
            o.state('A.A.A').query('A.A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A.A') === undefined,
            "Argument is expected to be a name, not a selector."
        );
    });

    test( "Additional mocks", function () {
        var x = new TestObject;

        assert.ok(
            x.state('ReallyDead').superstate('Finished') === x.state('Finished'),
            "`superstate()` resolves "
        );
        assert.ok(
            x.state('ReallyDead').superstate('') === x.state().root(),
            ""
        );
        assert.ok(
            x.state('ReallyDead').superstate() === x.state('Terminated'),
            ""
        );
        assert.ok(
            x.state().root().superstate() === undefined,
            ""
        );
    })
})();

( function () { module( "State.protostate" );

    function Mock () {}
    state( Mock.prototype, {
        A: {
            AA: {}
        },
        B: {}
    });

    Z.inherit( Submock, Mock );
    function Submock () {}
    state( Submock.prototype, {
        B: {
            BA: {},
            BB: {}
        },
        C: {}
    });

    test( "Stateful behavior of non-stateful inheritor", function () {
        var o = new Submock;

        assert.ok(
            o.state('A')  && o instanceof o.state('A') .owner().constructor &&
            o.state('AA') && o instanceof o.state('AA').owner().constructor &&
            o.state('B')  && o instanceof o.state('B') .owner().constructor &&
            o.state('BA') && o instanceof o.state('BA').owner().constructor &&
            o.state('BB') && o instanceof o.state('BB').owner().constructor &&
            o.state('C')  && o instanceof o.state('C') .owner().constructor,
            "Queried states are members of the object itself or one of its prototypes."
        );
        assert.ok(
            o.state().go('A') &&
            o.state().isVirtual() &&
            o.state().protostate() === Mock.prototype.state('A'),
            "Reaches past lower prototypes that do not contain a matching protostate."
        );
    });
})();

( function () { module( "State.protostate" );
    // A taxonomy is modeled with stateful objects employing standard prototypal inheritance.

    function Animal () {}
    Animal.prototype.move = function () { return 0; };
    state( Animal.prototype, {
        getThis: function () { return this; },

        Stationary: state( 'initial', {
            getThis: function () { return this; },
            move: function () { return false; }
        }),
        Moving: {
            move: function () { return true; }
        }
    });

    test( "First inheritor", function () {
        var animal = new Animal;

        assert.ok(
            animal.move() === false,
            ""
        );

        assert.ok(
            animal.getThis() === animal.state('Stationary'),
            ""
        );

        animal.state().change('Moving');
        assert.ok(
            animal.move() === true,
            ""
        );

        animal.state().change('');
        assert.ok(
            animal.move() === 0,
            ""
        );
    });

    Z.inherit( Bird, Animal );
    function Bird () {}
    state( Bird.prototype, {
        Moving: {
            Flying: {
                move: function () { return 'Flap flap'; }
            },
            Ambulating: {
                move: function () { return 'Waddle waddle'; }
            }
        }
    }, 'Stationary' );

    test( "Second inheritor", function () {
        var bird = new Bird;
        assert.ok( bird.constructor === Bird );

        var prototype = bird.constructor.prototype;
        assert.ok( prototype instanceof Animal && !( prototype instanceof Bird ) );

        var protostate = bird.state().root().protostate();
        assert.ok( protostate );
        assert.ok( protostate.owner() === prototype );
        assert.ok( protostate.controller().root() === protostate );

        assert.ok(
            bird.move() === false,
            ""
        );
        assert.ok(
            bird.getThis() === bird.state('Stationary'),
            ""
        );

        bird.state().change('Moving');
        assert.ok(
            bird.move() === true,
            "Method is inherited through the immediate protostate."
        );

        bird.state().change('Flying');
        assert.ok(
            bird.move() === "Flap flap",
            ""
        );

        bird.state().change('Ambulating');
        assert.ok(
            bird.move() === "Waddle waddle",
            ""
        );

        bird.state().change('..');
        assert.ok(
            bird.move() === true,
            ""
        );

        bird.state().change('Stationary');
        assert.ok(
            bird.move() === false,
            ""
        );
        bird.state().change('');
        assert.ok(
            bird.move() === 0,
            ""
        );
    });

    Z.inherit( Ostrich, Bird );
    function Ostrich () {}
    state( Ostrich.prototype, {
        Stationary: {
            HeadBuried: {
                move: function () { return 'Buttwiggle'; }
            }
        },
        Moving: {
            Flying: {
                move: function () {}
            },
            Ambulating: {
                Walking: {
                    move: function () { return 'Stomp stomp'; }
                },
                Running: {
                    move: function () { return 'Thumpthumpthumpthump'; }
                }
            },
            Kicking: {
                move: function () { return 'Pow!'; }
            }
        }
    });

    test( "Third inheritor", function () {
        var ostrich = new Ostrich;
        assert.strictEqual( ostrich.move(), false );

        ostrich.state().change('Moving');
        assert.ok(
            ostrich.move() === true,
            ""
        );

        ostrich.state().change('.Flying');
        assert.ok(
            ostrich.move() === undefined,
            ""
        );

        ostrich.state().change('..Ambulating');
        assert.ok(
            ostrich.move() === "Waddle waddle",
            ""
        );

        ostrich.state().change('.Walking');
        assert.ok(
            ostrich.move() === "Stomp stomp",
            ""
        );

        ostrich.state().change('..Running');
        assert.ok(
            ostrich.move() === "Thumpthumpthumpthump",
            ""
        );

        ostrich.state().change('....Stationary.HeadBuried');
        assert.ok(
            ostrich.move() === "Buttwiggle",
            ""
        );

        ostrich.state().change('Moving.Kicking');
        assert.ok(
            ostrich.move() === "Pow!",
            ""
        );
    });
})();

( function () { module( "State.realize" );
    function Class () {}
    state( Class.prototype, {
        A: state('initial'),
        B: {}
    });
    
    test( "", function () {
        var o = new Class;
        assert.ok(
            o.state() === o.state('A') &&
            o.state().isVirtual(),
            ""
        );

        o.state().realize();
        assert.ok(
            !o.state().isVirtual(),
            ""
        );

        assert.ok(
            !o.state('B').isVirtual() &&
            o.state('B').owner() !== o &&
            o.state('B').owner() === Class.prototype,
            "Querying inactive inherited state returns protostate, not virtual state."
        );

        o.state().change('B');
        assert.ok(
            o.state('B').isVirtual() &&
            o.state('B').owner() === o &&
            o.state('B').owner() !== Class.prototype,
            "Querying active inherited state returns virtual state, not protostate."
        );

        o.state().realize();
        assert.ok(
            !o.state().isVirtual() &&
            o.state().owner() === o,
            "Virtual state can be realized."
        );
    });
})();

( function () { module( "State.owner" );
    var o = {},
        s = state( o, {} );

    test( "", function () {
        assert.strictEqual( s.owner(), o );
    });
})();

( function () { module( "State.express" );
    var ref = {}, val = 1,
        expr = {
            data: { a:ref, b:val },

            peek: function () {},
            poke: function () {},

            depart: function () {},
            arrive: [ function () {}, function () {} ],

            admit: true,
            release: function () { return true; },

            A: {
                peek: function () {},
                poke: function () {},

                enter: 'B',
                exit: function () {}
            },
            B: {
                peek: function () {},
                poke: function () {},

                enter: function () {},
                exit: 'A'
            },

            transitions: {
                'Bang!': { origin: 'A', target: 'B', action: function () {
                    return this.end( "bang!" );
                }}
            }
        };

    test( "Transitivity", function () {
        var a = state( {}, expr ).express(),
            b = state( {}, a ).express();

        assert.ok(
            Z.isEqual( a, b ),
            "Output of `express()` can be used to create a new equivalently stateful object."
        );
    });
})();

( function () { module( "State.mutate" );
    var o = {};

    state( o, 'mutable', {
        data: { a:1, b:'two' },
        mutate: function ( expr, before, after, delta ) {
            assert.ok( true, "mutate event at root state" );
        },
        S1: {
            data: { a:3, b:'four' },
            run: function () { return 'foo'; },
            tap: 'S2',
            mutate: function ( expr, before, after, delta ) {
                assert.ok( true, "mutate event at substate" );
            }
        },
        S2: {
            data: { a:5, b:'six' },
            run: function () { return 'bar'; },
            tap: 'S1'
        }
    });

    test( "express() / mutate()", function () {
        var keys, id, list;

        function f ( n ) { return f[n] = function () {}; }

        id = o.state('S1').on( 'mutate', function ( expr, before, after, delta ) {
            var index = Z.keys( delta.events.tap )[0],
                compare = { events: { tap: {} } };
            compare.events.tap[ index ] = Z.NIL;
            assert.deepEqual( delta, compare, "delta.events.tap[" + index + "]:NIL" );
        });
        o.state().mutate({ S1:{ events:{ tap:'S3' } } });
        assert.strictEqual( o.state('S1').event('tap'), 2 );
        o.state('S1').off( 'mutate', id );

        keys = Z.keys( o.state('S1').express().events.tap );
        assert.strictEqual( o.state('S1').express().events.tap[ keys[0] ], 'S2' );
        assert.strictEqual( o.state('S1').express().events.tap[ keys[1] ], 'S3' );

        list = {};
        list[ keys[0] ] = list[ keys[1] ] = Z.NIL;
        o.state('S1').mutate({
            events: {
                tap: [ f(0), f(1), f(2), list ]
            }
        });
        assert.strictEqual( o.state('S1').event('tap'), 3 );

        keys = Z.keys( o.state('S1').express().events.tap );
        assert.strictEqual( o.state('S1').express().events.tap[ keys[0] ], f[0] );
        assert.strictEqual( o.state('S1').express().events.tap[ keys[1] ], f[1] );
        assert.strictEqual( o.state('S1').express().events.tap[ keys[2] ], f[2] );
    });
})();

( function () { module( "State.isIn" );

    test( "Additional mocks", function () {
        var x = new TestObject;
        assert.ok( x.state('Waiting').isIn( x.state().root() ) );
        assert.ok( x.state('CleaningUp').isIn( x.state().root() ) );
        assert.ok( x.state('CleaningUp').isIn( x.state('Finished') ) );
        assert.ok( !x.state('CleaningUp').isIn( x.state('Waiting') ) );
        assert.ok( x.state('Finished').isIn( x.state('Finished') ) );
        assert.ok( !x.state('Finished').isIn( x.state('CleaningUp') ) );
        assert.ok( !x.state('Finished').isIn( 'CleaningUp' ) );
        assert.ok( x.state('CleaningUp').isIn( '.' ) );
    });
})();

( function () { module( "State.isSuperstateOf" );

    test( "Additional mocks", function () {
        var x = new TestObject;
        assert.ok( x.state().root().isSuperstateOf( x.state('Waiting') ) );
        assert.ok( x.state().root().isSuperstateOf( x.state('CleaningUp') ) );
        assert.ok( x.state('Finished').isSuperstateOf( x.state('CleaningUp') ) );
        assert.ok( !x.state('Finished').isSuperstateOf( x.state('Active') ) );
    });
})();

( function () { module( "State.substates" );

    test( "Additional mocks", function () {
        var x = new TestObject,
            states = x.state().root().substates( true );
        assert.ok( ( states.length == 8 ) );
    });
})();

( function () { module( "State.initialSubstate" );

    function Foo () {}
    state( Foo.prototype, {
        Buzzy: {},
        Fizzy: state('initial')
    });

    Z.inherit( Bar, Foo );
    function Bar () {}
    state( Bar.prototype, {
        Fizzy: state( 'initial', {
            Fuzzy: state('initial')
        })
    });

    Z.inherit( Baz, Bar );
    function Baz () {}
    state( Baz.prototype, {
        Bzzt: {
            Bzzzzt: state('initial')
        },
        Buzzy: state( 'initial', {
            Bizzy: state('initial'),
            Bazzy: state('initial')
        })
    });

    Z.inherit( Qux, Baz );
    function Qux () {}
    state( Qux.prototype, {
        Wizzy: {
            Wuzzy: {}
        }
    });

    test( "Resolution of `initial` attribute", function () {
        assert.ok(
            Foo.prototype.state() === Foo.prototype.state('Fizzy') &&
            Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy') &&
            Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy'),
            "Resolves explicit `initial` attribute."
        );

        assert.ok(
            Qux.prototype.state().isVirtual() &&
            Qux.prototype.state().root().initialSubstate() === Qux.prototype.state('Bizzy') &&
            Qux.prototype.state().protostate() === Baz.prototype.state(),
            "Inheritor with no state marked `initial` inherits initialization from its "+
            "prototype."
        );
    });

    test( "Resolution through nested `initial` attributes", function () {
        assert.ok(
            Bar.prototype.state() !== Bar.prototype.state('Fizzy'),
            ""
        );
        assert.ok(
            Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy'),
            ""
        );
    });

    test( "Resolution of `initial` attribute within a malformed state expression", function () {
        assert.ok(
            Baz.prototype.state() !== Baz.prototype.state('Bzzt.Bzzzzt'),
            "Breadth-first: precedence falls to higher-ranked state marked `initial`."
        );
        assert.ok(
            Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy') &&
            Baz.prototype.state() !== Baz.prototype.state('Buzzy.Bazzy'),
            "Multiple `initial` attributes resolve to the first-encountered state marked "+
            "`initial`."
        );
    });

    test( "Inheritance of `initial` attribute", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        assert.ok(
            foo.state().name() === 'Fizzy',
            "Inheriting instance initializes to the current state of its prototype."
        );
        assert.ok(
            bar.state().name() === 'Fuzzy',
            ""
        );
        assert.ok(
            baz.state().name() === 'Bizzy',
            ""
        );
        assert.ok(
            qux.state().name() === 'Bizzy',
            ""
        );
    });

    test( "", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        foo.state().change('Buzzy');
        assert.ok(
            foo.state().name() === 'Buzzy',
            ""
        );

        bar.state().change('Buzzy');
        assert.ok(
            bar.state().name() === 'Buzzy',
            ""
        );

        baz.state().change('Fizzy');
        assert.ok(
            baz.state().name() === 'Fizzy',
            ""
        );

        qux.state().change('Fizzy');
        assert.ok(
            qux.state().isVirtual(),
            ""
        );
        assert.ok(
            qux.state().name() === 'Fizzy',
            ""
        );
    });
})();

( function () { module( "State.depth" );

    test( "Additional mocks", function () {
        var x = new TestObject;
        assert.equal( x.state().root().depth(), 0 );
        assert.equal( x.state('Finished.Terminated').depth(), 2 );
    });
})();

( function () { module( "State.common" );

    test( "Additional mocks", function () {
        var x = new TestObject;

        assert.ok(
            x.state('Terminated').common( x.state('Finished') ) === x.state('Finished'),
            ""
        );
        assert.ok(
            x.state('Terminated').common( x.state('CleaningUp') ) === x.state('Finished'),
            ""
        );
        assert.ok(
            x.state('Terminated').common( x.state('Active') ) === x.state().root(),
            ""
        );
        assert.ok(
            x.state().root().common( x.state().root() ) === x.state().root(),
            ""
        );
        assert.ok(
            x.state('Active').common( x.state('Terminated') ) === x.state().root(),
            ""
        );
        assert.ok(
            x.state('Waiting').common( x.state('Waiting') ) === x.state('Waiting'),
            ""
        );
        assert.ok(
            x.state('Finished').common( x.state('CleaningUp') ) === x.state('Finished'),
            ""
        );
    });
})();

0&&( function () { module( "State.removeState" );

    test( "removeState()", function () {
        // test simple removal
        // test removal of 'Finished' with substates
        // test removal of 'Finished' while inside a substate
        // test forced bubbling with removal of 'Finished' while inside 'Terminated'
    });
})();

( function () { module( "State.attributes" );

    function Class () {}
    state( Class.prototype, 'abstract retained shallow history', {
        A: state( 'default' ),
        B: state( 'initial' ),
        C: state( 'conclusive', {
            CA: {},
            CB: state( 'final' )
        })
    });

    test( "Existential test", function () {
        var o = new Class;

        assert.ok(
            o.state().is('B') &&
            o.state().isVirtual() &&
            o.state().isInitial(),
            "Initial state of instance inherits `initial` attribute from prototype."
        );

        assert.ok(
            o.state().root().isAbstract() &&
            o.state().root().isRetained() &&
            o.state().root().isShallow() &&
            o.state().root().hasHistory(),
            "Root state of instance inherits attributes "+
            "[ `abstract`, `retained`, `shallow`, `history` ] from prototype."
        );

        o.state().go('');
        assert.ok(
            o.state().is('A') &&
            o.state().isVirtual() &&
            o.state().isDefault(),
            ""
        );

        o.state().go('C');
        assert.ok(
            o.state().is('C') &&
            o.state().isConclusive(),
            ""
        );

        o.state().go('CB');
        o.state('CB');
        o.state().go('CA');
        assert.ok(
            !o.state().is('CA') &&
            o.state().is('CB') &&
            o.state().isFinal(),
            ""
        );
    });

    test( "Behavioral test", function () {
        var o = new Class;

        assert.ok(
            o.state().is('B'),
            "Inherits initialization from prototype."
        );

        o.state().go('');
        assert.ok(
            o.state().is('A'),
            "Inherits abstraction from prototype root and protostate `A`."
        );

        o.state().go('C');
        o.state().go('B');
        assert.ok(
            o.state().is('C') &&
            ( o.state().go('CA'), o.state().is('CA') ),
            "Inherits conclusivity from protostate `C`."
        );

        o.state().go('CB');
        o.state().go('CA');
        assert.ok(
            o.state().is('CB'),
            "Inherits finality from protostate `CB`."
        );
    });
})();

})( jQuery, QUnit || require('assert') );
