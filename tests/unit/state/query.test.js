module( "state/query" );

test( "Aliases", function () {
    var s = state({},{});

    ok( typeof s.query === 'function' &&
        s.query === s.match,
        "Alias `match` is provided."
    );
});

test( "Special cases", function () {
    var o = {};
    state( o, {
        A: {},
        B: {
            BA: {
                BAA: {}
            },
            BB: {},
            BC: {
                BCA: {},
                BCB: {}
            }
        }
    });

    ok( o.state( null ) === null &&
        o.state( undefined ) === null &&
        o.state().query( null, o.state('') ) === false &&
        o.state().query( null, "randomstring" ) === false &&
        o.state().query( null, null ) === false &&
        o.state().query( null, undefined ) === null,
        "Null selector returns null and matches nothing."
    );
    ok( o.state('') === o.state().root() &&
        o.state('A').query('') === o.state().root(),
        "Empty string selector resolves to the root state."
    );
    ok( O.isEqual( o.state('*'), [ o.state('A'), o.state('B') ] ),
        "Absolute single-wildcard selector returns an array of the immediate substates."
    );
    ok( O.isEqual( o.state('**'), [
            o.state('A'),
            o.state('B'),
            o.state('BA'),
            o.state('BAA'),
            o.state('BB'),
            o.state('BC'),
            o.state('BCA'),
            o.state('BCB')
        ]),
        "Absolute double-wildcard selector returns a flattened depth-first array of all "+
        "descendants."
    );
    ok( o.state().query( '*', o.state('') ) &&
         o.state().query( '*', o.state('B') ) &&
        !o.state().query( '*', o.state('BA') ),
        "Absolute single-wildcard selector matches the root state and its immediate "+
        "substates, but no further."
    );
    ok( o.state().query( '**', o.state('') ) &&
        o.state().query( '**', o.state('B') ) &&
        o.state().query( '**', o.state('BA') ) &&
        o.state().query( '**', o.state('BAA') ),
        "Absolute double-wildcard selector matches any state in the tree."
    );
    ok( !o.state().query( '.*', o.state('') ) &&
         o.state().query( '.*', o.state('B') ) &&
        !o.state().query( '.*', o.state('BA') ) &&
         o.state('B').query( '.*', o.state('BA') ) &&
        !o.state('B').query( '.*', o.state('BAA') ),
        "Relative single-wildcard selector matches the local state's immediate substates."
    );
});

test( "Disambiguation", function () {
    var o = {};
    state( o, {
        A: state( 'initial', {
            B: {},
            D: {
                E: {}
            }
        }),
        B: {},
        C: {
            D: {},
            E: {}
        }
    });
    ok( o.state('B').superstate() === o.state('') &&
        o.state('B').superstate() !== o.state('A'),
        "Absolute selector gives precedence to the higher-ranked state."
    );
    ok( o.state('.B') === o.state('A.B') &&
        o.state('.B') !== o.state('B'),
        "Relative selector gives precedence to the descendant of the current state."
    );
    o.state('->');
    ok( o.state('.B') === o.state('B'),
        "Relative selector disambiguates differently as the current state changes."
    );
    ok( o.state('.D').superstate() !== o.state('') &&
        o.state('.D') === o.state('A.D') &&
        o.state('.D') !== o.state('C.D'),
        "Relative selector with no local match is recursed to descendants."
    );
    ok( o.state('.E') === o.state('C.E') &&
        o.state('.E') !== o.state('A.D.E'),
        "Relative selector with no local match recursively descends breadth-first."
    );
    o.state('-> A');
    ok( o.state('.C').superstate() === o.state(''),
        "Relative selector with no local or descendant match is recursed to the superstate."
    );
});

test( "Resolution across ambiguously named nested states", function () {
    var o = {};
    state( o, {
        A: {
            A: {
                A: {
                    A: {}
                }
            }
        }
    });

    ok( o.state('A').query('.A') === o.state('A.A') &&
        o.state('A.A').query('.A') === o.state('A.A.A') &&
        o.state('A.A.A').query('.A') === o.state('A.A.A.A') &&
        o.state('A.A.A.A').query('.A') === o.state('A.A.A.A') &&
        o.state('A.A.A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A.A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A.A').query('.A.A') === o.state('A.A.A.A') &&
        o.state('A').query('.A.A') === o.state('A.A.A'),
        ""
    );
});

test( "Additional mock tests", function () {
    var x = new TestObject;
    ok( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ) );
    ok( x.state().query( 'Finished.*', x.state('Finished.Terminated') ) );
    ok( !x.state().query( 'Finished.*', x.state('Waiting') ) );
    ok( !x.state().query( 'Finished.*', x.state('Finished') ) );
    ok( x.state('Finished').query( '.Terminated', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.CleaningUp') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
    ok( x.state().query( '*', x.state('Finished') ) );
    ok( !x.state().query( '*', x.state('Finished.Terminated') ) );
    ok( x.state().query( '**', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.*', x.state('Finished.Terminated') ) );
    ok( x.state('Finished').query( '.**', x.state('Finished.Terminated') ) );

    strictEqual( x.state().query( 'Finished' ), x.state('Finished') );
    strictEqual( x.state().query( '*' ).length, 3 );
    strictEqual( x.state().query( '**' ).length, 8 );
    strictEqual( x.state('Finished').query( '.Terminated' ), x.state('Finished.Terminated') );
    strictEqual( x.state('Finished').query( '.*' ).length, 2 );
    strictEqual( x.state().query( '*', x.state('Finished') ), true );
    strictEqual( x.state().query( '*', x.state('Finished.CleaningUp') ), false );
    strictEqual( x.state().query( '**', x.state('Finished.CleaningUp') ), true );
    strictEqual( x.state().query( 'Finished.*', x.state('Finished.CleaningUp') ), true );
    strictEqual( x.state().query( 'Finished.*', x.state('Finished.Terminated') ), true );

    x.state('-> Waiting');
    ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
    ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
    x.state('->');
    ok( x.state('ReallyDead') === x.state('Finished.Terminated.ReallyDead') );
    ok( x.state('Tweaked') === x.state('Active.Hyperactive.Tweaked') );
    x.state('-> Tweaked');
});
