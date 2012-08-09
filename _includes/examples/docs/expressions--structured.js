var longformExpression = state({
    methods: {
        greet: function () { return "Hello."; }
    },
    states: {
        Formal: {
            methods: {
                greet: function () { return "How do you do?"; }
            },
            events: {
                enter: function () { this.owner().wearTux(); }
            }
        },
        Informal: {
            methods: {
                greet: function () { return "Hi!"; }
            },
            events: {
                enter: function () { this.owner().wearJeans(); }
            }
        }
    }
});