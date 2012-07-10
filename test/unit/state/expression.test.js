module( "state/expression" );

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

test( "Transitivity of `express()`", function () {
    var a = state( {}, expr ).express(),
        b = state( {}, a ).express();

    ok( O.isEqual( a, b ),
        "Output of `express()` can be used to create a new equivalently stateful object."
    );
});
