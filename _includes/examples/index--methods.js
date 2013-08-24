function Avenger ( name ) {
    this.name = name;
}
Avenger.prototype.greet = function () {
    return "Hello.";
};
state( Avenger.prototype, 'abstract', {
    Terse: state('default'),
    Verbose: state({
        greet: state.bind( function () {
            return this.superstate.call('greet') +
                " My name is " + this.owner.name + ".";
        })
    })
});


var person = new Avenger('Inigo');
person.state();                   // >>> State 'Terse'
person.greet();                   // >>> "Hello."

person.state('-> Verbose');       // >>> State 'Verbose'
person.greet();                   // >>> "Hello. My name is Inigo."
