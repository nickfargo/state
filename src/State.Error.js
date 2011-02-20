State.Error = $.extend( true,
	function StateError( message ) {
		this.name = "StateError";
		this.message = message;
	}, {
		prototype: { __proto__: Error.prototype }
	}
);

State.EventError = $.extend( true,
	function StateEventError( message ) {
		this.name = "StateEventError";
		this.message = message;
	}, {
		prototype: { __proto__: State.Error.prototype }
	}
);

State.DefinitionError = $.extend( true,
	function StateDefinitionError( message ) {
		this.name = "StateDefinitionError";
		this.message = message;
	}, {
		prototype: { __proto__: State.Error.prototype }
	}
);
