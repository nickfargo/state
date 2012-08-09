var object = {};
state( object, {
    A: state( 'initial', {
        admit: false,
        release: { D: false }
    }),
    B: {
        data: { bleep: 'bleep' },
        release: {
            'C, D': true,
            'C.**': false
        }
    },
    C: {
        data: { blorp: 'blorp' },
        admit: true,
        C1: {
            C1a: state
        },
        C2: state
    },
    D: {
        enter: function () {
            this.$('B').removeGuard( 'admit' );
        },
        admit: function ( fromState ) {
            return 'blorp' in fromState.data()
        },
        release: function ( toState ) {
            return 'bleep' in toState.data()
        }
    }
});