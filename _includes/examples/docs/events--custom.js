function Kid () {}
state( Kid.prototype, {
    Happy: state,
    Sad: state,

    events: {
        gotIceCream: function () { this.be('Happy'); },
        spilledIceCream: function () { this.be('Sad'); }
    }
});


var junior = new Kid;

junior.state().emit('gotIceCream');
junior.state();                          // >>> State 'Happy'

junior.state().emit('spilledIceCream');
junior.state();                          // >>> State 'Sad'