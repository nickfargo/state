module( "state/model" );

test( "owner", function () {
    var o = {};
    var s = state( o, {} );

    ok( s.owner() === o,
        "ok"
    );
});


( function () {

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

    test( "superstate: common usage", function () {
        var o = new Mock;

        ok( o.state('A.A.A').superstate() === o.state('A.A'),
            "Calling `superstate` with no arguments returns the immediate superstate."
        );
    });

    test( "superstate: special cases", function () {
        var o = new Mock;

        ok( o.state('').superstate() === undefined,
            "Calling from the root state returns `undefined`."
        );
        ok( o.state('D').superstate('*') === undefined,
            "Calling with a nonsensical argument returns `undefined`."
        );
    });

    test( "superstate: resolution of named ancestor argument", function () {
        var o = new Mock;

        ok( o.state('A.A.A').superstate('') === o.state(''),
            "Empty string resolves to the root state."
        );
        ok( o.state('A.A.A').superstate('A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A') !== o.state('A'),
            "Ambiguous name resolves to the nearest ancestor."
        );
        ok( o.state('A.A.A').query('A.A') === o.state('A.A') &&
            o.state('A.A.A').superstate('A.A') === undefined,
            "Argument is expected to be a name, not a selector."
        );
    });

    test( "superstate: additional mocks", function () {
        var x = new TestObject;

        ok( x.state('ReallyDead').superstate('Finished') === x.state('Finished'),
            "`superstate()` resolves "
        );
        ok( x.state('ReallyDead').superstate('') === x.state().root(),
            ""
        );
        ok( x.state('ReallyDead').superstate() === x.state('Terminated'),
            ""
        );
        ok( x.state().root().superstate() === undefined,
            ""
        );
    });

}() );

( function () {

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

    test( "protostate: stateful behavior of non-stateful inheritor", function () {
        var o = new Submock;

        ok( o.state('A')  && o instanceof o.state('A') .owner().constructor &&
            o.state('AA') && o instanceof o.state('AA').owner().constructor &&
            o.state('B')  && o instanceof o.state('B') .owner().constructor &&
            o.state('BA') && o instanceof o.state('BA').owner().constructor &&
            o.state('BB') && o instanceof o.state('BB').owner().constructor &&
            o.state('C')  && o instanceof o.state('C') .owner().constructor,
            "Queried states are members of the object itself or one of its prototypes."
        );
        ok( o.state().go('A') &&
            o.state().isVirtual() &&
            o.state().protostate() === Mock.prototype.state('A'),
            "Reaches past lower prototypes that do not contain a matching protostate."
        );
    });

}() );

( function () {
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

    test( "protostate: first inheritor", function () {
        var animal = new Animal;

        ok( animal.move() === false,
            ""
        );

        ok( animal.getThis() === animal.state('Stationary'),
            ""
        );

        animal.state('-> Moving');
        ok( animal.move() === true,
            ""
        );

        animal.state('->');
        ok( animal.move() === 0,
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

    test( "protostate: second inheritor", function () {
        var bird = new Bird;
        ok( bird.constructor === Bird );

        var prototype = bird.constructor.prototype;
        ok( prototype instanceof Animal && !( prototype instanceof Bird ) );

        var protostate = bird.state().root().protostate();
        ok( protostate );
        ok( protostate.owner() === prototype );
        ok( protostate.controller().root() === protostate );

        ok( bird.move() === false,
            ""
        );
        ok( bird.getThis() === bird.state('Stationary'),
            ""
        );

        bird.state('-> Moving');
        ok( bird.move() === true,
            "Method is inherited through the immediate protostate."
        );

        bird.state('-> Flying');
        ok( bird.move() === "Flap flap",
            ""
        );

        bird.state('-> Ambulating');
        ok( bird.move() === "Waddle waddle",
            ""
        );

        bird.state('-> ..');
        ok( bird.move() === true,
            ""
        );

        bird.state('-> Stationary');
        ok( bird.move() === false,
            ""
        );
        bird.state('->');
        ok( bird.move() === 0,
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

    test( "protostate third inheritor", function () {
        var ostrich = new Ostrich;
        strictEqual( ostrich.move(), false );

        ostrich.state('-> Moving');
        ok( ostrich.move() === true,
            ""
        );

        ostrich.state('-> .Flying');
        ok( ostrich.move() === undefined,
            ""
        );

        ostrich.state('-> ..Ambulating');
        ok( ostrich.move() === "Waddle waddle",
            ""
        );

        ostrich.state('-> .Walking');
        ok( ostrich.move() === "Stomp stomp",
            ""
        );

        ostrich.state('-> ..Running');
        ok( ostrich.move() === "Thumpthumpthumpthump",
            ""
        );

        ostrich.state('-> ....Stationary.HeadBuried');
        ok( ostrich.move() === "Buttwiggle",
            ""
        );

        ostrich.state('-> Moving.Kicking');
        ok( ostrich.move() === "Pow!",
            ""
        );
    });

}() );


test( "isIn", function () {
    var x = new TestObject;

    ok( x.state('Waiting').isIn( x.state().root() ) );
    ok( x.state('Waiting').isIn('') );
    ok( x.state('CleaningUp').isIn('') );
    ok( x.state('CleaningUp').isIn( x.state('Finished') ) );
    ok( !x.state('CleaningUp').isIn( x.state('Waiting') ) );
    ok( x.state('Finished').isIn( x.state('Finished') ) );
    ok( !x.state('Finished').isIn( x.state('CleaningUp') ) );
    ok( !x.state('Finished').isIn('CleaningUp') );
    ok( x.state('CleaningUp').isIn('.') );
});

test( "isSuperstateOf", function () {
    var x = new TestObject;

    ok( x.state().root().isSuperstateOf('Waiting') );
    ok( x.state().root().isSuperstateOf('CleaningUp') );
    ok( x.state('Finished').isSuperstateOf('CleaningUp') );
    ok( !x.state('Finished').isSuperstateOf('Active') );
});

test( "substates", function () {
    var x = new TestObject;
    var states = x.state().root().substates( true );

    ok( states.length === 8 );
});

( function () {

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

    test( "initialSubstate: resolution of `initial` attribute", function () {
        ok( Foo.prototype.state() === Foo.prototype.state('Fizzy') &&
            Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy') &&
            Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy'),
            "Resolves explicit `initial` attribute."
        );

        ok( Qux.prototype.state().isVirtual() &&
            Qux.prototype.state().root().initialSubstate() === Qux.prototype.state('Bizzy') &&
            Qux.prototype.state().protostate() === Baz.prototype.state(),
            "Inheritor with no state marked `initial` inherits initialization from its "+
            "prototype."
        );
    });

    test( "initialSubstate: resolution through nested `initial` attributes", function () {
        ok( Bar.prototype.state() !== Bar.prototype.state('Fizzy'),
            ""
        );
        ok( Bar.prototype.state() === Bar.prototype.state('Fizzy.Fuzzy'),
            ""
        );
    });

    test( "initialSubstate: resolution of `initial` attribute within a malformed state expression", function () {
        ok( Baz.prototype.state() !== Baz.prototype.state('Bzzt.Bzzzzt'),
            "Breadth-first: precedence falls to higher-ranked state marked `initial`."
        );
        ok( Baz.prototype.state() === Baz.prototype.state('Buzzy.Bizzy') &&
            Baz.prototype.state() !== Baz.prototype.state('Buzzy.Bazzy'),
            "Multiple `initial` attributes resolve to the first-encountered state marked "+
            "`initial`."
        );
    });

    test( "initialSubstate: inheritance of `initial` attribute", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        ok( foo.state().name() === 'Fizzy',
            "Inheriting instance initializes to the current state of its prototype."
        );
        ok( bar.state().name() === 'Fuzzy',
            ""
        );
        ok( baz.state().name() === 'Bizzy',
            ""
        );
        ok( qux.state().name() === 'Bizzy',
            ""
        );
    });

    test( "initialSubstate: ", function () {
        var foo = new Foo,
            bar = new Bar,
            baz = new Baz,
            qux = new Qux;

        foo.state().change('Buzzy');
        ok( foo.state().name() === 'Buzzy',
            ""
        );

        bar.state().change('Buzzy');
        ok( bar.state().name() === 'Buzzy',
            ""
        );

        baz.state().change('Fizzy');
        ok( baz.state().name() === 'Fizzy',
            ""
        );

        qux.state().change('Fizzy');
        ok( qux.state().isVirtual(),
            ""
        );
        ok( qux.state().name() === 'Fizzy',
            ""
        );
    });
}() );

test( "depth", function () {
    var x = new TestObject;
    equal( x.state().root().depth(), 0 );
    equal( x.state('Finished.Terminated').depth(), 2 );
});

test( "common", function () {
    var x = new TestObject;

    ok( x.state('Terminated').common( x.state('Finished') ) === x.state('Finished'),
        ""
    );
    ok( x.state('Terminated').common( x.state('CleaningUp') ) === x.state('Finished'),
        ""
    );
    ok( x.state('Terminated').common( x.state('Active') ) === x.state().root(),
        ""
    );
    ok( x.state().root().common( x.state().root() ) === x.state().root(),
        ""
    );
    ok( x.state('Active').common( x.state('Terminated') ) === x.state().root(),
        ""
    );
    ok( x.state('Waiting').common( x.state('Waiting') ) === x.state('Waiting'),
        ""
    );
    ok( x.state('Finished').common( x.state('CleaningUp') ) === x.state('Finished'),
        ""
    );
});

