function Container () {}
Container.prototype = Object.create( View );
Container.prototype.constructor = Container;

state( Container.prototype, 'abstract', {
    Grid: state('default initial'),
    List: state,

    transitions: {
        GridToList: {
            origin: 'Grid', target: 'List',
            action: function () {
                // Rearrange subviews into a vertical column
                // Change states of the subviews, if applicable
                // Load model data as appropriate for this state
                this.end();
            }
        },
        ListToGrid: {
            origin: 'List', target: 'Grid',
            action: function () {
                // ...
                this.end();
            }
        }
    }
});