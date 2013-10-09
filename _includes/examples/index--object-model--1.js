state( Actor.prototype, {
    Casual: state({
        greet: function () { return "Hi!"; }
    }),
    Formal: state({
        greet: function () { return "How do you do?"; }
    })
});
