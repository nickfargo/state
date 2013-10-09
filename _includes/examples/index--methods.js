function Avenger ( name ) {
    this.name = name;
}

Avenger.prototype.greet = function () { return "Hello."; };

state( Avenger.prototype, 'abstract', {
    Terse: state('default'),
    Verbose: state({
        greet: state.bind( function () {
            return this.superstate.call('greet') +
                " My name is " + this.owner.name + "...";
        })
    })
});


var inigo = new Avenger('Inigo');

inigo.state();              // >>> State 'Terse'
inigo.greet();              // >>> "Hello."

inigo.state('-> Verbose');  // >>> State 'Verbose'
inigo.greet();              // >>> "Hello. My name is Inigo..."
