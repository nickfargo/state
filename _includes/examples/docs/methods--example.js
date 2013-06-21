var fs = require('fs'),
    state = require('state'),
    bind = state.bind;

function Document ( location, text ) {
    this.location = function () {
        return location;
    };
    this.read = function () {
        return text;
    };
    this.edit = function ( newText ) {                      // [1]
        text = newText;
        return this;
    };
}
state( Document.prototype, 'abstract', {
    freeze: bind( function () {                             // [3]
        var result = this.call('save');                     // [4]
        this.go('Frozen');
        return result;
    }),

    Dirty: {
        save: bind( function () {
            var owner = this.owner(),
                args = [ owner.location(), owner.read() ];
            this.go( 'Saved', args );                       // [5]
            return owner;
        })
    },
    Saved: state( 'initial', {
        edit: bind( function () {
            var ss = this.superstate,
                result = ss.apply( 'edit', arguments );     // [2]
            this.go('Dirty');
            return result;
        }),

        Frozen: state( 'final', {
            edit: function () {},
            freeze: function () {}
        })
    }),

    transitions: {
        Writing: {
            origin: 'Dirty', target: 'Saved',
            action: bind( function ( location, text ) {
                var transition = this;
                function cb ( err ) {
                    if ( err ) {
                        return transition.abort( err ).go('Dirty');
                    }
                    transition.end();
                }
                return fs.writeFile( location, text, cb );
            })
        }
    }
});