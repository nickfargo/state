function DivisibleByThreeComputer () {
    state( this, 'abstract', {
        s0: state( 'default initial',
            { '0':'s0', '1':'s1' } ),
        s1: { '0':'s2', '1':'s0' },
        s2: { '0':'s1', '1':'s2' }
    });
}
DivisibleByThreeComputer.prototype.compute = function ( number ) {
    var i, l, binary = number.toString(2);
    this.state('->'); // reset
    for ( i = 0, l = binary.length; i < l; i++ ) {
        this.state().emit( binary[i] );
    }
    return this.state().is('s0');
}

var three = new DivisibleByThreeComputer;
three.compute( 8 );          // >>> false
three.compute( 78 );         // >>> true
three.compute( 1000 );       // >>> false
three.compute( 504030201 );  // >>> true