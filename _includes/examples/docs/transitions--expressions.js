// An asynchronous logger
function log ( message, callback ) { /* ... */ }

function Foo () {}
state( Foo.prototype, 'abstract', {
    Bar: state( 'default initial' ),
    Baz: state({
        transitions: {
            Zig: { action: function () {
                var transition = this;
                log( "BLEEP", function () { transition.end(); } );
            } }
        }
    }),

    transitions: {
        Zig: { origin: 'Bar', target: 'Baz', action: function () {
            var transition = this;
            log( "bleep", function () { transition.end(); } );
        } },
        Zag: { origin: 'Baz', target: 'Bar', action: function () {
            var transition = this;
            log( "blorp", function () { transition.end(); } );
        } }
    }
});

var foo = new Foo;

function zig () {
    var transition;
    foo.state();                   // State 'Bar'
    foo.state('-> Baz');           // (enacts `Zig` of `Baz`)
    transition = foo.state();      // Transition 'Zig'
    transition.on( 'end', zag );
}

function zag () {
    var transition;
    foo.state();                   // State 'Baz'
    foo.state('-> Bar');           // (enacts `Zag` of root state)
    transition = foo.state();      // Transition `Zag`
    transition.on( 'end', stop );
}

function stop () {
    return "take a bow";
}

zig();
// ...
// log <<< "BLEEP"
// ...
// log <<< "blorp"