module( "state/attributes" );

( function () {

    function Class () {}
    state( Class.prototype, 'abstract retained shallow history', {
        A: state( 'default' ),
        B: state( 'initial' ),
        C: state( 'conclusive', {
            CA: {},
            CB: state( 'final' )
        })
    });

    test( "Existential test", function () {
        var o = new Class;

        ok( o.state().is('B') &&
            o.state().isVirtual() &&
            o.state().isInitial(),
            "Initial state of instance inherits `initial` attribute from prototype."
        );

        ok( o.state().root().isAbstract() &&
            o.state().root().isRetained() &&
            o.state().root().isShallow() &&
            o.state().root().hasHistory(),
            "Root state of instance inherits attributes "+
            "[ `abstract`, `retained`, `shallow`, `history` ] from prototype."
        );

        o.state().go('');
        ok( o.state().is('A') &&
            o.state().isVirtual() &&
            o.state().isDefault(),
            ""
        );

        o.state().go('C');
        ok( o.state().is('C') &&
            o.state().isConclusive(),
            ""
        );

        o.state().go('CB');
        o.state('CB');
        o.state().go('CA');
        ok( !o.state().is('CA') &&
            o.state().is('CB') &&
            o.state().isFinal(),
            ""
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