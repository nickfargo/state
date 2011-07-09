// exposes everything on one place on the global object
( typeof exports !== 'undefined' ? exports :
	// typeof module !== 'undefined' ? module.exports : 
	global ).State = State;

global.Deferral = Deferral;
global.when = when;

})();
