function Actor () {}
state( Actor.prototype, 'abstract', {
    Casual: state({
        greet: function () { return "Hi!"; }
    }),
    Formal: state( 'default', {
        greet: function () { return "How do you do?"; }
    })
});
