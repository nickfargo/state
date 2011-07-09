( function ( undefined ) {

module( "Deferral ( when then always succeed forfeit )" );

asyncTest( "when( multiple ), all succeed", function () {
	var	result, aside,
		d = new Deferral(),
		d2 = new Deferral();
		d3 = new Deferral();
	
	function setResultTrue () {
		result = true;
	}
	function setResultFalse () {
		result = false;
	}
	function setAsideTrue() {
		aside = true;
	}
	
	when( d, d2, d3 )
		.then( [ setResultTrue, setAsideTrue ], setResultFalse )
		.always(
			function () {
				ok( result === true && aside === true, "result === true, aside === true" );
				ok( result !== false, "result !== false" );
				ok( result != null, "result != null")
			},
			start
		);
	
	setTimeout( function () {
		d.succeed();
	}, 25 );
	
	setTimeout( function () {
		d2.succeed();
	}, 50 );
	
	setTimeout( function () {
		d3.succeed();
	}, 75 );
});

asyncTest( "when( multiple ), early forfeit", function () {
	var	result, aside,
		d = new Deferral(),
		d2 = new Deferral();
	
	function setResultTrue () {
		result = true;
	}
	function setResultFalse () {
		result = false;
	}
	function setAsideTrue() {
		aside = true;
	}

	when( d, d2 )
		.then( [ setResultTrue, setAsideTrue ], setResultFalse )
		.always(
			function () {
				ok( result !== true, "result !== true" );
				ok( result === false, "result === false" );
				ok( result != null, "result != null")
			},
			start
		);
	
	setTimeout( function () {
		d.forfeit();
	}, 25 );
	
	setTimeout( function () {
		d2.succeed();
	}, 50 );
});

})();