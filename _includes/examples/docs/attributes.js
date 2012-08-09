state( obj, 'abstract', {
    Alive: state( 'default initial mutable', {
        update: function () { /*...*/ }
    }),
    Dead: state( 'final', {
        update: function () { /*...*/ }
    })
});