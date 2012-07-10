module( "state/attributes" );

( function () {

    function Class () {}
    state( Class.prototype, 'abstract retained shallow history', {
        A: state( 'default' ),
        B: state( 'initial' ),
        C: state( 'conclusive', {
            CA: state,
            CB: state( 'final' )
        })
    });

    test( "Determination", function () {
        var o = new Class;

        ok( o.state().is('B') &&
            o.state().isVirtual() &&
            o.state().isInitial(),
            "Initial state of instance inherits `initial` attribute from prototype."
        );

        ok( o.state('').isAbstract() &&
            o.state('').isRetained() &&
            o.state('').isShallow() &&
            o.state('').hasHistory(),
            "Root state of instance inherits attributes "+
            "[ `abstract`, `retained`, `shallow`, `history` ] from prototype."
        );

        o.state('->');
        ok( o.state().is('A') &&
            o.state().isVirtual() &&
            o.state().isDefault(),
            ""
        );

        o.state('-> C');
        o.state('-> B');
        ok( !o.state().is('B') &&
            o.state().is('C') &&
            o.state().isConclusive(),
            "Should disallow transition that exits from `conclusive` state"
        );

        o.state('-> CB');
        ok( o.state().is('CB'),
            "Should allow transition that does not exit from `conclusive` state"
        );

        o.state('-> CA');
        ok( !o.state().is('CA') &&
            o.state().is('CB') &&
            o.state().isFinal(),
            "Should disallow transition that departs from `final` state"
        );
    });

    test( "Behavioral test", function () {
        var o = new Class;

        ok( o.state().is('B'),
            "Inherits initialization from prototype."
        );

        o.state().go('');
        ok( o.state().is('A'),
            "Inherits abstraction from prototype root and protostate `A`."
        );

        o.state().go('C');
        o.state().go('B');
        ok( o.state().is('C') &&
            ( o.state().go('CA'), o.state().is('CA') ),
            "Inherits conclusivity from protostate `C`."
        );

        o.state().go('CB');
        o.state().go('CA');
        ok( o.state().is('CB'),
            "Inherits finality from protostate `CB`."
        );
    });

}() );