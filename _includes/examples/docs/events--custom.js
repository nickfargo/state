function Kid () {}
state( Kid.prototype, {
    Happy: state,
    Sad: state,

    events: {
        gotIceCream: function () { this.be('Happy'); },
        spilledIceCream: function () { this.be('Sad'); }
    }
});


var jr = new Kid;

jr.state().emit('gotIceCream');
jr.state();                          // >>> State 'Happy'

jr.state().emit('spilledIceCream');
jr.state();                          // >>> State 'Sad'