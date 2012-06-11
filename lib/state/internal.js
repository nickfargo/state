// ### Internal

// <a class="icon-link"
//    name="state--privileged--peek"
//    href="#state--privileged--peek"></a>
// 
// #### peek
// 
// Exposes private entities to code within the same module-level lexical
// scope. Callers must authenticate themselves as internal by providing a
// `referenceToModule` that matches the closed unique module-scoped object
// `__MODULE__` (which in a CommonJS environment is equivalent to the
// standard `module`).
State.privileged.peek = function (
        /*Function*/ expressionConstructor,
          /*Number*/ attributes,
          /*Object*/ data, methods, events, guards, substates, transitions,
    /*StateHistory*/ history
) {
    var members = {
            expressionConstructor: expressionConstructor,
            attributes: attributes,
            data: data,
            methods: methods,
            events: events,
            guards: guards,
            substates: substates,
            transitions: transitions,
            history: history
        };

    return function (
        /*<module>*/ referenceToModule,
          /*String*/ name
    ) {
        if ( referenceToModule !== __MODULE__ ) throw ReferenceError;
        return name ? members[ name ] : Z.clone( members );
    };
};

State.prototype.peek = Z.noop;
