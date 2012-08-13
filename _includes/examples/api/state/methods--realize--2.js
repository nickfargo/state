mover.state('-> Running');
s = mover.state();                 // >>> State 'Running'
s.isVirtual();                     // >>> true
s.addMethod( 'move', function () { return "Boing"; } );
s.isVirtual();                     // >>> false