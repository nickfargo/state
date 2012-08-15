module( "state/attributes" );

( function () {

    function Parent () {}
    state( Parent.prototype, 'abstract retained shallow history', {
        A: state( 'default' ),
        B: state( 'initial' ),
        C: state( 'conclusive', {
            CA: state,
            CB: state( 'final' )
        })
    });

    O.inherit( Child, Parent );
    function Child () {}
    state( Child.prototype, 'concrete' );


    test( "Abstraction", function () {
        var o;

        o = {};
        state( o, {} );
        ok( o.state().isConcrete() &&
            !o.state().isAbstract(),
            "Empty state defaults to `concrete`"
        );

        ok( Parent.prototype.state('').isAbstract() &&
            !Parent.prototype.state('').isConcrete(),
            "`abstract` attribute properly negates `concrete`"
        );

        ok( !Child.prototype.state('').isAbstract() &&
            Child.prototype.state('').isConcrete(),
            "First inheritor has nominally appropriate abstraction"
        );

        o = new Child;
        ok( !o.state('').isAbstract() &&
            o.state('').isConcrete(),
            "Second inheritor has nominally appropriate abstraction"
        );

        o = new Parent;
        state( o, 'abstract concrete', {} );
        ok( !o.state('').isAbstract() &&
            o.state('').isConcrete(),
            "Bad production that includes both causes `abstract` to be negated"
        );

        o = new Child;
        state( o, 'abstract', {} );
        ok( o.state(),
            "Second inheritor overrides abstraction overrides of first inheritor"
        );
        o.state('->');
        ok( o.state().is('A'),
            "Inherited `default` attribute on substate responds properly to overriding literal `abstract` superstate"
        );
    });

    test( "Determination", function () {
        var o = new Parent;

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
        var o = new Parent;

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