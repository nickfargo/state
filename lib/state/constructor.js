// ### [`state/constructor.js`](#state--constructor.js)

// ### [Constructor](#state--constructor)
function State ( superstate, name, expression ) {
    if ( !( this instanceof State ) ) {
        return new State( superstate, name, expression );
    }

    var attributes, controller, superAttributes, protostate, protoAttributes;

    attributes = expression && expression.attributes || NORMAL;

    // #### [name](#state--constructor--name)
    // 
    // Returns the local name of this state.
    //
    // > [name](/api/#state--methods--name)
    this.name = O.stringFunction( function () { return name || ''; } );

    // A root state is created by a [`StateController`](#state-controller),
    // which passes a reference to itself into the `superstate` parameter,
    // signaling that a `controller` method closing over the reference needs to
    // be created for this instance.
    if ( superstate instanceof StateController ) {
        controller = superstate; superstate = undefined;
        controller.root = O.thunk( this );
        this.controller = O.thunk( controller );
    }

    // Otherwise this state is an inheritor of an existing superstate.
    else if ( superstate ) {
        this.superstate = privileged.superstate( superstate );

        // The `mutable` and `finite` attributes are inherited from the
        // superstate.
        superAttributes = superstate.attributes();
        attributes |= superAttributes & ( MUTABLE | FINITE );
    }

    // The set of “protostate-heritable” attributes are inherited from the
    // protostate.
    if ( protostate = this.protostate() ) {
        protoAttributes = protostate.attributes();
        protoAttributes &= PROTOSTATE_HERITABLE_ATTRIBUTES;

        // Literal `concrete` forcibly contradicts literal `abstract`; if a
        // bad production includes both attributes, negate `abstract`.
        if ( attributes & CONCRETE ) {
            attributes &= ~ABSTRACT;
        }

        // Literal `abstract` may override inherited `concrete`, and vice
        // versa, so filter those attributes out of the protostate before
        // inheriting.
        if ( attributes & ( ABSTRACT | CONCRETE ) ) {
            protoAttributes &= ~( ABSTRACT | CONCRETE );
        }
        attributes |= protoAttributes;
    }

    // If at this point the state is not `abstract`, then `concrete` must be
    // imposed.
    if ( ~attributes & ABSTRACT ) {
        attributes |= CONCRETE;
    }

    // Literal or inherited `immutable` is an absolute contradiction of
    // `mutable` and implication of `finite`.
    attributes |= ( superAttributes | protoAttributes ) & IMMUTABLE;
    if ( attributes & IMMUTABLE ) {
        attributes &= ~MUTABLE;
        attributes |= FINITE;
    }

    // Only a few instance methods are required for a virtual state,
    // including one ([`realize`](#state--privileged--realize)) method which
    // if called later will convert the virtual state into a real state.
    if ( attributes & VIRTUAL ) {
        this.attributes = privileged.attributes( attributes );
        this.realize = privileged.realize( attributes );
        attributes & MUTABLE && O.assign( this, mutableVirtualMethods );
    }

    // For a real state, the remainder of construction is delegated to the
    // class-private [`realize`](#state--private--realize) function.
    else {
        realize.call( this, superstate, attributes, expression );
    }

    // Additional property assignments for easy viewing in the inspector.
    if ( O.env.debug ) {
        this[' <owner>'] = this.owner();
        this[' <path>']  = this.derivation( true ).join('.');
        this['<attr>']   = StateExpression.decodeAttributes( attributes );
    }
}

State.prototype.name = O.noop;

var privileged = State.privileged = {};
