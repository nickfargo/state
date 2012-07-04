module( "state/virtualization" );

test( "realize", function () {
	function Class () {}
	state( Class.prototype, {
	    A: state('initial'),
	    B: {}
	});

    var o = new Class;

    ok( o.state() === o.state('A') &&
        o.state().isVirtual(),
        ""
    );

    o.state().realize();
    ok( !o.state().isVirtual(),
        ""
    );

    ok( !o.state('B').isVirtual() &&
        o.state('B').owner() !== o &&
        o.state('B').owner() === Class.prototype,
        "Querying inactive inherited state returns protostate, not virtual state."
    );

    o.state().change('B');
    ok( o.state('B').isVirtual() &&
        o.state('B').owner() === o &&
        o.state('B').owner() !== Class.prototype,
        "Querying active inherited state returns virtual state, not protostate."
    );

    o.state().realize();
    ok( !o.state().isVirtual() &&
        o.state().owner() === o,
        "Virtual state can be realized."
    );
});
