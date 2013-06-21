function inherit ( child, parent ) {
    child.prototype = Object.create( parent.prototype );
    return child.prototype.constructor = child;
}

inherit( Sophisticate, Person );
function Sophisticate ( name ) {
    this.name = name;
}
state( Sophisticate.prototype, 'abstract', {
    Formal: state( 'default initial', {
        Cordial: {
            greet: state.bind( function ( person ) {
                var greeting = this.superstate.call('greet');
                var name = person && person.name;
                return name ?
                    "Hello " + name + ". " + greeting :
                    greeting;
            })
        }
    }),
    Casual: {
        greet: state.fix( function ( autostate, protostate ) {
            return function ( person ) {
                var name = person && person.name;
                if ( name === 'Lane' ) return "How’s it hanging?";
                if ( name ) return "Hi " + name + ".";
                return protostate.call('greet');
            };
        })
    }
});


var sterling = new Sophisticate('Roger');
var cooper   = new Sophisticate('Bert');
var draper   = new Sophisticate('Don');
var pryce    = new Sophisticate('Lane');

draper.state();               // >>> State 'Formal'
draper.greet( new Person );   // >>> "How do you do?"

draper.state('-> Cordial');
draper.greet( new Person );   // >>> "How do you do?"
draper.greet( cooper );       // >>> "Hello Bert. How do you do?"
draper.greet( sterling );     // >>> "Hello Roger. How do you do?"

draper.state('-> Casual');
draper.greet( new Person );   // >>> "Hi!"
draper.greet( sterling );     // >>> "Hi Roger."
draper.greet( pryce );        // >>> "How’s it hanging?"