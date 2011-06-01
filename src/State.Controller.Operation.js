State.Controller.Operation = extend( true,
	function StateControllerOperation ( type ) {
		var result,
			getResult;
		
		extend( this, {
			type: function () {
				return type;
			},
			result: ( getResult = function () { return result; } ).toString = getResult,
			setResult: function ( value ) { return ( result === undefined ) ? ( result = !!value ) : undefined; }
		});
	}, {
		Types: {
			addState: {
				newState: undefined
			},
			changeState: {
				fromState: undefined,
				toState: undefined
			}
		}
	}
)