var bind = state.bind;

function Kid () {}
state( Kid.prototype, {
    Happy: state,
    Sad: state,

    events: {
        gotIceCream: bind( function () {
            this.be('Happy');
        }),
        spilledIceCream: bind( function () {
            this.be('Sad');
        })
    }
});


var jr = new Kid;

jr.state().emit('gotIceCream');
jr.state();                          // >>> State 'Happy'

jr.state().emit('spilledIceCream');
jr.state();                          // >>> State 'Sad'