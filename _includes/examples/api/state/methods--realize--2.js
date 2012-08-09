s = mover.state('-> Running');     // >>> State 'Running'
s.isVirtual();                     // >>> true
s.addMethod( 'move', function () { return "Boing"; } );
s.isVirtual();                     // >>> false