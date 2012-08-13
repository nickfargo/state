var log = function ( msg ) { return console.log( msg ); },
    owner = {},
    root;

state( owner, 'abstract', {
    foo: function () { log("I exist!"); },

    A: state( 'default', {
        bar: function () { log("So do I!"); }
    }),
    B: state
});
// >>> State 'A'

root = owner.state('');
root.on( 'noSuchMethod', function ( methodName, args ) {
    log("`owner` has no method " + methodName + " in this state!");
});
root.on( 'noSuchMethod:bar': function () {
    log("Here’s another way to trap a bad call to 'bar'.");
});

owner.foo();            // log <<< "I exist!"
owner.bar();            // log <<< "So do I!"
owner.state('-> B');
owner.state();          // >>> State 'B'
owner.foo();            // log <<< "I exist!"
owner.bar();            // >>> undefined
// log <<< "`owner` has no method 'bar' in this state!"
// log <<< "Here’s another way to trap a bad call to 'bar'."