var o = {};
state( o, {
    A: {
        AA: state( 'initial', {
            AAA: state
        }),
        AB: state
    },
    B: state
});

o.state();            // >>> State 'AA'
o.state('');          // >>> State ''
o.state('A.AA.AAA');  // >>> State 'AAA'
o.state('.');         // >>> State 'AA'
o.state('..');        // >>> State 'A'
o.state('...');       // >>> State ''
o.state('.AAA');      // >>> State 'AAA'
o.state('..AB');      // >>> State 'AB'
o.state('...B');      // >>> State 'B'
o.state('AAA');       // >>> State 'AAA'
o.state('.*');        // >>> [ State 'AAA' ]
o.state('AAA.*');     // >>> []
o.state('*');         // >>> [ State 'A', State 'B' ]
o.state('**');        // >>> [ State 'A', State 'AA', State 'AAA',
                      //       State 'AB', State 'B' ]