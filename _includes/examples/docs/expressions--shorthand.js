var shorthandExpression = state({
    greet: function () { return "Hello."; },

    Formal: {
        enter: function () { this.wearTux(); },
        greet: function () { return "How do you do?"; }
    },
    Casual: {
        enter: function () { this.wearJeans(); },
        greet: function () { return "Hi!"; }
    }
});
// >>> StateExpression