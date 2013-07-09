function Class () {}
var p = Class.prototype;
state( p, { A: state } );

var o = new Class;
o.state('A').on('enter', function () {});           // [1]
state.fix( o, 'A' ).on('enter', function () {});    // [2]
