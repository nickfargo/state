/**
 * StateProxy allows a state controller to reference a protostate from within its own state hierarchy.
 */
function StateProxy ( superstate, name ) {
	var	getName;
	Z.extend( this, {
		superstate: function () { return superstate; },
		name: ( getName = function () { return name || ''; } ).toString = getName,
		
		// TODO: implement `invalidate`
		// If protostate gets destroyed or removed, it should invalidate this proxy 
		invalidate: function () {
			// tell controller to eject itself
		}
	});
}

Z.extend( true, StateProxy, {
	prototype: Z.extend( true, new State( null, "[StateProxy prototype]" ), {
		guard: function ( guardName ) {
			// TODO: this.protostate() isn't resolving when it should
					// CAUSE: derived object doesn't have its StateController.name set, so it can't match with prototype's StateController
			if ( !this.protostate() ) {
				// debugger;
			}
			return this.protostate().guard( guardName );
		}
	})
});
