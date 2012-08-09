var RootState = ( function () {
	O.inherit( RootState, State );

	function RootState ( owner, accessorName, expression ) {
		this.owner = O.thunk( owner );

		State.call( this, undefined, '', expression );

		var controller = new StateController( owner, undefined );
	}

	return RootState;
}() );
