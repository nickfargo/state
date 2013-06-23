var owner = {};
state( owner, 'abstract', {
    aState: state( 'initial default', {
        aMethod: function () {}
    }),
    anotherState: {
        aSubstate: state
    }
});