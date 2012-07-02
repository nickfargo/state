// <a class="icon-link"
//    name="state--constructor.js"
//    href="#state--constructor.js"></a>
// 
// ### `state/constructor.js`

// <a class="icon-link"
//    name="state--constructor"
//    href="#state--constructor"></a>
//
// ### Constructor
function State ( superstate, name, expression ) {
    if ( !( this instanceof State ) ) {
        return new State( superstate, name, expression );
    }

    var attributes, controller, superstateAttributes, protostate,
        protostateAttributes;

    attributes = expression && expression.attributes || NORMAL;

    // #### name
    // 
    // Returns the local name of this state.
    this.name = Z.stringFunction( function () { return name || ''; } );

    // A root state is created by a [`StateController`](#state-controller),
    // which passes a reference to itself into the `superstate` parameter,
    // signaling that a `controller` method closing over the reference needs to
    // be created for this instance.
    if ( superstate instanceof StateController ) {
        controller = superstate; superstate = undefined;
        controller.root = Z.thunk( this );
        this.controller = Z.thunk( controller );
    }

    // Otherwise this state is an inheritor of an existing superstate.
    else if ( superstate ) {
        this.superstate = privileged.superstate( superstate );

        // The `mutable` and `finite` attributes are inherited from the
        // superstate.
        superstateAttributes = superstate.attributes();
        attributes |= superstateAttributes & ( MUTABLE | FINITE );
    }

    // The set of “protostate-heritable” attributes are inherited from the
    // protostate.
    if ( protostate = this.protostate() ) {
        protostateAttributes = protostate.attributes();
        attributes |= protostateAttributes & PROTOSTATE_HERITABLE_ATTRIBUTES;
    }

    // Literal or inherited `immutable` is an absolute contradiction of
    // `mutable` and implication of `finite`.
    attributes |= ( superstateAttributes | protostateAttributes ) & IMMUTABLE;
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
        attributes & MUTABLE && Z.assign( this, mutableVirtualMethods );
    }

    // For a real state, the remainder of construction is delegated to the
    // class-private [`realize`](#state--private--realize) function.
    else {
        realize.call( this, superstate, attributes, expression );
    }

    // Additional property assignments for easy viewing in the inspector.
    if ( Z.env.debug ) {
        this[' <owner>'] = this.owner();
        this[' <path>']  = this.derivation( true ).join('.');
        this['<attr>']   = StateExpression.decodeAttributes( attributes );
    }
}

State.prototype.name = Z.noop;

var privileged = State.privileged = {};
