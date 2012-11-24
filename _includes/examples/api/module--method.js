var q = {}
state( q, {
    A: {
        inherited: function () {
            return {
                autostate: autostate,
                protostate: protostate,
                superstate: superstate,
                owner: owner
            };
        }
    }
});

var p = ( function () {
    var question = null;
    var answer = 42;

    // Don’t call this ...
    function plain ( param ) {                                  // [1]
        return {
            question: question,
            answer: answer,
            param: param,
            autostate: autostate,
            protostate: protostate,
            "this": this,
            superstate: superstate,
            owner: owner
        };
    }

    var p = Object.create( q );
    state( p, {
        A: {
            // ... call this
            lexical: state.method({                             // [2]
                question: question,
                answer: answer
            })( plain ),

            inherited: state.method(
                { q: question, a: answer },
                function ( param ) {
                    var stuff;
                    var ok = true;

                    stuff = autostate.call( 'lexical', param );
                    ok && ( ok =
                        stuff.question === q &&
                        stuff.answer === a &&
                        stuff.param === param
                    );

                    stuff = protostate.call('inherited');
                    ok && ( ok =
                        stuff.autostate === protostate &&
                        stuff.protostate === undefined &&
                        stuff.superstate === superstate.protostate() &&
                        stuff.owner.isPrototypeOf( owner )
                    );

                    return ok;
                }
            )
        }
    });
    
    return p;
}() );

var o = Object.create( p );
o.state('-> A');

o.lexical("foo");
// >>> { question: null,
//       answer: 42,
//       param: "foo",
//       autostate: [State]      <- 'A' of `Class.prototype`
//       protostate: [State]     <- 'A' of `Class.prototype`
//       this: [State],          <- 'A' of `o`
//       superstate: [State],    <- root state of `o`
//       owner: [Class]          <- `Class.prototype`
//     }

o.inherited("bar");
// >>> true