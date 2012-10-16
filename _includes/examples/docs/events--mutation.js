var flavors = [
    'vanilla',
    'chocolate',
    'strawberry',
    'AmeriCone Dream'
];

function Kid () {}
state( Kid.prototype, 'mutable', {
    data: {
        favorite: 'chocolate'
    },

    waver: function () {
        var i = Math.random() * flavors.length << 0;
        this.data({ favorite: flavors[i] });
    },
    whine: function ( complaint ) {
        if ( typeof console !== 'undefined' ) {
            console.log( complaint );
        }
    },

    mutate: function ( mutation, delta, before, after ) {
        this.owner().whine(
            "I hate " + delta.favorite +
            ", I want " + mutation.favorite + "!"
        );
    }
});


var jr = new Kid;

// We could have added listeners this way also:
jr.state().on( 'mutate', function ( mutation, delta ) { /*...*/ } );

jr.waver();  // log <<< "I hate chocolate, I want strawberry!"
jr.waver();  // log <<< "I hate strawberry, I want chocolate!"
jr.waver();  // No whining! On a whim, junior stood pat this time.
jr.waver();  // log <<< "I hate chocolate, I want AmeriCone Dream!"