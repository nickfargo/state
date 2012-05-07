// <a name="state" href="#state">&#x1f517;</a>
// 
// ## State
// 
// A **state** models a set of behaviors on behalf of an owner object. The owner may undergo
// **transitions** that change its **current** state from one to another, and in so doing adopt a
// different set of behaviors.
// 
// Distinct behaviors are modeled in each state by defining a set of method overrides, to which
// calls made on the owner will be redirected so long as a state remains current.
// 
// States are nested hierarchically in a tree structure, with **substates** that inherit from their 
// **superstate**. While a substate is current, it and all of its ancestor superstates are
// considered to be **active**.
// 
// In addition, a state also recognizes the owner object’s prototypal inheritance, identifying an
// identically named and positioned state in the prototype as its **protostate**. Behavior is
// always inherited *from protostates first*, then from superstates.

var State = ( function () {
    var SA = STATE_ATTRIBUTES,

        HERITABLE_ATTRIBUTES =
            SA.MUTABLE    |
            SA.INITIAL    |  SA.CONCLUSIVE  |  SA.FINAL    |
            SA.ABSTRACT   |  SA.DEFAULT     |  SA.SEALED   |
            SA.RETAINED   |  SA.HISTORY     |  SA.SHALLOW  |
            SA.CONCURRENT;


    Z.assign( State, SA );

    // <a name="state--constructor" href="#state--constructor">&#x1f517;</a>
    // 
    // ### Constructor
    function State ( superstate, name, expression ) {
        if ( !( this instanceof State ) ) {
            return new State( superstate, name, expression );
        }

        var attributes, controller, protostate;

        attributes = expression && expression.attributes || SA.NORMAL;

        // #### name
        // 
        // Returns the local name of this state.
        this.name = Z.stringFunction( function () { return name || ''; } );

        // A root state is created by a [`StateController`](#state-controller), which passes a
        // reference to itself into the `superstate` parameter, signaling that a `controller`
        // method needs to be created for this instance.
        if ( superstate instanceof StateController ) {
            controller = superstate, superstate = undefined;
            controller.root = Z.thunk( this );
            this.controller = Z.thunk( controller );
        }

        // Otherwise this state is an inheritor of an existing superstate, so an instance method
        // for `superstate` is required.
        else if ( superstate ) {
            this.superstate = State.privileged.superstate( superstate );

            // The `mutable` attribute is inherited from the superstate.
            attributes |= superstate.attributes() & SA.MUTABLE;
        }

        // Heritable attributes are copied from the protostate.
        protostate = this.protostate();
        protostate && ( attributes |= protostate.attributes() & HERITABLE_ATTRIBUTES );

        // Only a few instance methods are required for a virtual state, including one
        // ([`realize`](#state--privileged--realize)) which if called later will convert the
        // virtual state into a real state.
        if ( attributes & SA.VIRTUAL ) {
            Z.privilege( this, State.privileged, { 'attributes realize' : [ attributes ] });
        }

        // Do the full setup required for a real state.
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

    // ### Class-private functions

    // <a name="state--private--realize" href="#state--private--realize">&#x1f517;</a>
    // 
    // #### realize
    // 
    // Continues construction for an incipient or virtual [`State`](#state) instance.
    // 
    // Much of the initialization for `State` is offloaded from the
    // [constructor](#state--constructor), allowing for creation of lightweight virtual
    // `State` instances that inherit all of their functionality from protostates, but can also be
    // converted later to a real `State` if necessary.
    // 
    // *See also:* [`StateController virtualize`](#state-controller--private--virtualize),
    // [`State.privileged.realize`](#state--privileged--realize)
    function realize ( superstate, attributes, expression ) {
        var data = {},
            methods = {},
            events = {},
            guards = {},
            substates = {},
            transitions = {},
            history = attributes & SA.HISTORY || attributes & SA.RETAINED ? [] : null;

        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this, {
            __private__: {
                attributes: attributes,
                data: data,
                methods: methods,
                events: events,
                guards: guards,
                substates: substates,
                transitions: transitions
            }
        });

        function setSuperstate ( value ) { return superstate = value; }

        // Method names are mapped to specific local variables. The named methods are created on
        // `this`, each of which is a partial application of its corresponding method factory at
        // [`State.privileged`](#state--privileged).
        Z.privilege( this, State.privileged, {
            'express mutate' : [ StateExpression, data, methods, events, guards, substates,
                transitions ],
            'superstate' : [ superstate ],
            'attributes' : [ attributes ],
            'data' : [ data ],
            'method methodNames addMethod removeMethod' : [ methods ],
            'event addEvent removeEvent emit' : [ events ],
            'guard addGuard removeGuard' : [ guards ],
            'substate substates addSubstate removeSubstate' : [ substates ],
            'transition transitions addTransition' : [ transitions ],
            'destroy' : [ setSuperstate, methods, events, substates ]
        });
        history && Z.privilege( this, State.privileged, {
            'history push replace' : [ history ]
        });
        Z.alias( this, { addEvent: 'on bind', removeEvent: 'off unbind', emit: 'trigger' } );

        State.privileged.init( StateExpression ).call( this, expression );

        return this;
    }

    // <a name="state--private--create-realizer"
    //    href="#state--private--create-realizer">&#x1f517;</a>
    // 
    // #### createRealizer
    // 
    // Creates a method that will first [`realize`](#state--private--realize) the state and then,
    // under the assumption that realization has produced a new method of the same name on the
    // instance, invoke the method.
    function createRealizer ( obj, names ) {
        Z.forEach( Z.trim( names ).split( Z.regexp.whitespace ), function ( name ) {
            obj[ name ] = function () { return this.realize()[ name ].apply( this, arguments ); };
        });
    }

    // <a name="state--private--create-delegator"
    //    href="#state--private--create-delegator">&#x1f517;</a>
    // 
    // #### createDelegator
    // 
    // Creates a function that will serve as a **delegator** method on an owner object. For each
    // method defined in any of the owner’s states, a delegator must be created and assigned on
    // the owner itself, at the `methodName` key. This delegator then forwards any calls to
    // `methodName` to the owner’s current state, which will locate the appropriate implementation
    // for the method, apply it, and return the result.
    // 
    // If an owner already has an implementation for a delegated method, it is copied into the
    // owner’s root state, such that it remains accessible as the owner’s “default behavior” if
    // none of its active states contains an implementation for that method.
    // 
    // Stateful methods are applied in the context of the [`State`](#state) to which they belong,
    // or, if a method is inherited from a protostate, the context will be the corresponding
    // virtual state within the local [`StateController`](#state-controller). However, for any
    // a priori methods relocated to the root state, the context appropriately remains bound to
    // the owner object.
    // 
    // *See also:* [`State.privileged.addMethod`](#state--privileged--add-method)
    function createDelegator ( accessorKey, methodName, original ) {
        function delegator () {
            return this[ accessorKey ]().apply( methodName, arguments );
        }

        delegator.isDelegator = true;
        original && ( delegator.original = original );

        return delegator;
    }

    // <a name="state--privileged" href="#state--privileged">&#x1f517;</a>
    // 
    // ### Privileged methods
    // 
    // Methods defined here typically are partially applied either within or down-stack from
    // [`State`](#state) or an inheriting constructor (e.g., [`Transition`](#transition)).
    State.privileged = {

        // <a name="state--privileged--init" href="#state--privileged--init">&#x1f517;</a>
        // 
        // #### init
        // 
        // Builds out the state’s members based on the expression provided.
        init: function ( /*Function*/ expressionConstructor ) {
            return function ( /*<expressionConstructor> | Object*/ expression ) {
                this.__initializing__ = true;
                this.mutate( expression );
                delete this.__initializing__;
                this.emit( 'construct', expression, false );
                return this;
            };
        },

        // <a name="state--privileged--realize" href="#state--privileged--realize">&#x1f517;</a>
        // 
        // #### realize
        // 
        // Transforms a virtual state into a “real” state.
        // 
        // A virtual state is a lightweight [`State`](#state) instance whose purpose is simply to
        // inherit from its protostate. As such virtual states are weakly bound to a state
        // hierarchy by their reference held at `superstate`, and are not proper members of the
        // superstate’s set of substates. Transforming the state from virtual to real causes it to
        // exist thereafter as an abiding member of its superstate’s set of substates.
        // 
        // *See also:* [`State realize`](#state--private--realize) 
        realize: function ( attributes ) {
            return function ( expression ) {
                var superstate = this.superstate();
                delete this.realize;
                if ( superstate.addSubstate( this.name(), this ) ) {
                    realize.call( this, superstate, attributes & ~SA.VIRTUAL, expression );
                }
                return this;
            };
        },

        // <a name="state--privileged--express" href="#state--privileged--express">&#x1f517;</a>
        // 
        // #### express
        // 
        // Returns an expression that describes the state’s contents. By default the returned
        // expression is a plain `Object`; if `typed` is truthy the expression is a formally
        // typed [`StateExpression`](#state-expression).
        express: ( function () {
            function clone ( obj ) {
                if ( obj === undefined ) return;
                var out = null, key, value;
                for ( key in obj ) {
                    value = obj[ key ];
                    ( out || ( out = {} ) )[ key ] = value && typeof value === 'object' ?
                        Z.clone( obj[ key ] ) :
                        value;
                }
                return out;
            }

            function cloneEvents ( events ) {
                if ( events === undefined ) return;
                var out = null, type, collection;
                for ( type in events ) if ( collection = events[ type ] ) {
                    ( out || ( out = {} ) )[ type ] = Z.clone( collection.items );
                }
                return out;
            }

            function recurse ( substates, typed ) {
                if ( substates === undefined ) return;
                var out = null;
                Z.forEach( substates, function ( substate, name ) {
                    ( out || ( out = {} ) )[ name ] = substate.express( typed );
                });
                return out;
            }

            return function (
                /*Function*/ expressionConstructor,
                  /*Object*/ data, methods, events, guards, substates, transitions
            ) {
                return function ( /*Boolean*/ typed ) {
                    var expression = {},
                        attributes = this.attributes();

                    Z.edit( expression, {
                        attributes:  this.attributes(),
                        data:        clone( data ),
                        methods:     clone( methods ),
                        events:      cloneEvents( events ),
                        guards:      clone( guards ),
                        states:      recurse( substates, typed ),
                        transitions: clone( transitions )
                    });

                    return typed ? new expressionConstructor( expression ) : expression;
                };
            };
        })(),

        // <a name="state--privileged--mutate" href="#state--privileged--mutate">&#x1f517;</a>
        // 
        // #### mutate
        // 
        // Transactionally mutates the state by adding, updating, or removing items as specified
        // by the expression provided in `expr`. 
        mutate: function (
            /*Function*/ expressionConstructor,
              /*Object*/ data, methods, events, guards, substates, transitions
        ) {
            return function (
                /*<expressionConstructor> | Object*/ expr,
                                         /*Boolean*/ viaSuper
            ) {
                expr instanceof expressionConstructor ||
                    ( expr = new expressionConstructor( expr ) );

                viaSuper === undefined && ( viaSuper = true );

                var self = this,
                    NIL = Z.NIL,
                    before, collection, name, value, after, delta;

                if ( !this.__initializing__ ) {
                    before = this.express();
                }

                this.__atomic__ = true;

                // Data is already set up to handle differentials that contain `NIL` values.
                expr.data && this.data( expr.data );

                // Methods are stored as a simple key mapping, and
                // [`addMethod`](#state--privileged--add-method) can be used both to create an
                // entry and to update an existing entry, without any additional side-effects, so
                // method expressions can simply be compared against the `NIL` value.
                collection = expr.methods;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    value !== NIL ? this.addMethod( name, value ) : this.removeMethod( name );
                }

                // Event listeners for a given event type might be expressed as a simple `Array`
                // of items to be added, as a plain `Object` that maps items to specific keys in
                // the internal event collection that should be updated or deleted, or as an
                // `Array` that also includes one or more such `Object`s.
                expr.events && Z.forEach( expr.events, function ( object, type ) {
                    var items, edit, add, i, l,
                        eventCollection = events[ type ];

                    if ( object === NIL ) return eventCollection && eventCollection.empty();

                    // If an event collection object does not already exist for this event type,
                    // then one will be created, so long as `object` is expected to contain items
                    // to be added.
                    if ( !eventCollection && object && !Z.isEmpty( object ) ) {
                        eventCollection = events[ type ] = new StateEventCollection( self, type );
                    }

                    items = eventCollection.items;

                    edit = function ( object ) {
                        var key, value;
                        for ( key in object ) if ( Z.hasOwn.call( object, key ) ) {
                            value = object[ key ];
                            if ( value === NIL ) {
                                eventCollection.remove( key );
                            } else if ( value && value !== items[ key ] ) {
                                eventCollection.set( key, value );
                            }
                        }
                    };

                    if ( Z.isArray( object ) ) {
                        add = function ( object ) { return self.addEvent( type, object ); };
                        for ( i = 0, l = object.length; i < l; i++ ) {
                            value = object[i];
                            if ( value == null || value === NIL ) continue;
                            ( Z.isPlainObject( value ) ? edit : add )( value );
                        }
                    } else if ( Z.isPlainObject( object ) ) {
                        edit( object );
                    }

                    eventCollection.length || eventCollection.destroy() && delete events[ type ];
                });

                // Guards are stored as simple objects, and altering them causes no side-effects,
                // so a deep `edit` is sufficient.
                expr.guards && Z.edit( 'deep', guards, expr.guards );

                // Substates are instances of [`State`](#State), which are either created,
                // destroyed, or recursively updated in place, as specified by `expr.states`.
                collection = expr.states;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    if ( name in substates ) {
                        value === NIL ?
                            substates[ name ].destroy() :
                            substates[ name ].mutate( value, false );
                    } else {
                        this.addSubstate( name, value );
                    }
                }

                // Transitions are instances of [`TransitionExpression`](#transition-expression),
                // which are either created, deleted, or replaced, as specified by
                // `expr.transitions`.
                collection = expr.transitions;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    if ( name in transitions ) {
                        if ( value === NIL ) {
                            delete transitions[ name ];
                        } else {
                            transitions[ name ] = new TransitionExpression( value );
                        }
                    } else {
                        this.addTransition( name, value );
                    }
                }

                delete this.__atomic__;

                if ( before ) {
                    after = this.express();
                    delta = Z.diff( before, after );
                    if ( !Z.isEmpty( delta ) ) {
                        this.emit( 'mutate', [ expr, before, after, delta ], false );
                    }
                }

                return this;
            };
        },

        // <a name="state--privileged--superstate"
        //    href="#state--privileged--superstate">&#x1f517;</a>
        // 
        // #### superstate
        // 
        // Returns the immediate superstate, or the nearest state in the superstate chain with
        // the provided `stateName`.
        superstate: function ( /*State*/ superstate ) {
            return function (
                /*String*/ stateName // optional
            ) {
                return stateName === undefined ?
                    superstate
                    :
                    superstate ?
                        stateName ?
                            superstate.name() === stateName ?
                                superstate : superstate.superstate( stateName )
                            :
                            this.controller().root()
                        :
                        undefined;
            }
        },

        // <a name="state--privileged--attributes"
        //    href="#state--privileged--attributes">&#x1f517;</a>
        // 
        // #### attributes
        // 
        // Returns the bit-field representing the state’s attribute flags.
        attributes: function ( /*Number*/ attributes ) {
            return function () { return attributes; };
        },

        // <a name="state--privileged--data" href="#state--privileged--data">&#x1f517;</a>
        // 
        // #### data
        // 
        // Either retrieves or edits a block of data associated with this state.
        // 
        // `data( [Boolean viaSuper], [Boolean viaProto] )`
        // 
        // Retrieves data attached to this state, including all data from inherited states, unless
        // specified otherwise by the inheritance flags `viaSuper` and `viaProto`.
        // 
        // `data( Object edit )`
        // 
        // Edits data on this state. For keys in `edit` whose values are set to the `NIL`
        // directive, the matching keys in `data` are deleted. If the operation results in a change
        // to `data`, a `mutate` event is emitted for this state.
        data: function ( /*Object*/ data ) {
            return function ( /*Boolean*/ viaSuper, /*Boolean*/ viaProto ) {
                var edit, delta, state, superstate, protostate;

                if ( viaSuper != null && typeof viaSuper !== 'boolean' ) {
                    edit = viaSuper, viaSuper = viaProto = false;
                } else {
                    viaSuper === undefined && ( viaSuper = true );
                    viaProto === undefined && ( viaProto = true );
                }

                if ( edit && !Z.isEmpty( edit ) ) {
                    if ( this.isVirtual() ) return this.realize().data( edit );

                    delta = Z.delta( data, edit );
                    if ( !this.__atomic__ && delta && !Z.isEmpty( delta ) ) {
                        this.push( 'delta', this, null, delta );
                        this.emit( 'mutate', [ edit, delta ], false );
                    }
                }
                else {
                    return Z.clone(
                        viaSuper && ( superstate = this.superstate() ) &&
                            superstate.data(),
                        viaProto && ( protostate = this.protostate() ) &&
                            protostate.data( false ),
                        data
                    );
                }

                return this;
            }
        },

        // <a name="state--privileged--method" href="#state--privileged--method">&#x1f517;</a>
        // 
        // #### method
        // 
        // Retrieves the named method held on this state. If no method is found, step through
        // this state’s protostate chain to find one. If no method is found there, step up the
        // superstate hierarchy and repeat the search.
        method: function ( methods ) {
            return function (
                 /*String*/ methodName,
                /*Boolean*/ viaSuper,    // = true
                /*Boolean*/ viaProto,    // = true
                 /*Object*/ out          // optional
            ) {
                var superstate, protostate, method;

                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );

                methods && ( method = methods[ methodName ] );

                if ( method && method !== Z.noop ) {
                    out && ( out.context = this, out.method = method );
                    return method;
                }

                if ( viaProto ) {
                    protostate = this.protostate();
                    if ( protostate ) {
                        method = protostate.method( methodName, false, true, out );
                        if ( method ) {
                            out && ( out.context = this );
                            return method;
                        }
                    }
                }

                if ( viaSuper ) {
                    superstate = this.superstate();
                    if ( superstate ) {
                        method = superstate.method( methodName, true, viaProto, out );
                        if ( method ) return method;
                    }
                }

                out && ( out.context = null, out.method = method );
                return method;
            };
        },

        // <a name="state--privileged--method-names"
        //    href="#state--privileged--method-names">&#x1f517;</a>
        // 
        // #### methodNames
        // 
        // Returns an `Array` of names of methods defined for this state.
        methodNames: function ( methods ) {
            return function () {
                return Z.keys( methods );
            };
        },

        // <a name="state--privileged--add-method"
        //    href="#state--privileged--add-method">&#x1f517;</a>
        // 
        // #### addMethod
        // 
        // Adds a method to this state, which will be callable directly from the owner, but with
        // its context bound to the state.
        // 
        // *See also:* [`State createDelegator`](#state--private--create-delegator)
        addMethod: function ( methods ) {
            return function ( /*String*/ methodName, /*Function*/ fn ) {
                var controller = this.controller(),
                    controllerName = controller.name(),
                    root = controller.root(),
                    owner = controller.owner(),
                    ownerMethod;

                // If there is not already a method called `methodName` in the state hierarchy,
                // then the owner and controller need to be set up properly to accommodate calls
                // to this method.
                if ( !this.method( methodName, true, false ) ) {
                    if ( this !== root && !root.method( methodName, false, false ) ) {
                        ownerMethod = owner[ methodName ];
                        if ( ownerMethod === undefined || ownerMethod.isDelegator ) {
                            ownerMethod = Z.noop;
                        }
                        root.addMethod( methodName, ownerMethod );
                    }

                    // A delegator function is instated on the owner, which will direct subsequent
                    // calls to `owner[ methodName ]` to the controller, and then on to the
                    // appropriate state’s implementation.
                    owner[ methodName ] =
                        createDelegator( controllerName, methodName, ownerMethod );
                }

                return methods[ methodName ] = fn;
            };
        },

        // <a name="state--privileged--remove-method"
        //    href="#state--privileged--remove-method">&#x1f517;</a>
        // 
        // #### removeMethod
        // 
        // Dissociates the named method from this state object and returns its function.
        removeMethod: function ( methods ) {
            return function ( /*String*/ methodName ) {
                var fn = methods[ methodName ];
                delete methods[ methodName ];
                return fn;
            };
        },

        // <a name="state--privileged--event" href="#state--privileged--event">&#x1f517;</a>
        // 
        // #### event
        // 
        // Returns a registered event listener, or the number of listeners registered, for a given
        // event `type`.
        // 
        // If an `id` as returned by [`addEvent`](#state--privileged--add-event) is provided, the
        // event listener associated with that `id` is returned. If no `id` is provided, the number
        // of event listeners registered to `type` is returned.
        event: function ( events ) {
            return function (
                        /*String*/ eventType,
             /*String | Function*/ id
            ) {
                var collection = events[ eventType ];

                if ( collection == null ) return;
                if ( id === undefined ) return collection.length;

                typeof id === 'function' && ( id = collection.key( id ) );
                return collection.get( id );
            };
        },

        // <a name="state--privileged--add-event" href="#state--privileged--add-event">&#x1f517;</a>
        // 
        // #### addEvent
        // 
        // Binds an event listener to the specified `eventType` and returns a unique identifier
        // for the listener. Built-in event types are listed at `STATE_EVENT_TYPES`.
        // 
        // *Aliases:* **on**, **bind**
        addEvent: function ( events ) {
            return function (
                  /*String*/ eventType,
                /*Function*/ fn,
                  /*Object*/ context    // = this
            ) {
                Z.hasOwn.call( events, eventType ) ||
                    ( events[ eventType ] = new StateEventCollection( this, eventType ) );

                return events[ eventType ].add( fn, context );
            };
        },

        // <a name="state--privileged--remove-event"
        //    href="#state--privileged--remove-event">&#x1f517;</a>
        // 
        // #### removeEvent
        // 
        // Unbinds the event listener with the specified `id` that was supplied by
        // [`addEvent`](#state--privileged--add-event).
        // 
        // *Aliases:* **off**, **unbind**
        removeEvent: function ( events ) {
            return function ( /*String*/ eventType, /*String*/ id ) {
                return events[ eventType ].remove( id );
            };
        },

        // <a name="state--privileged--emit" href="#state--privileged--emit">&#x1f517;</a>
        // 
        // #### emit
        // 
        // Invokes all listeners bound to the given event type.
        //
        // Arguments for the listeners can be passed as an array to the `args` parameter.
        // 
        // Callbacks are invoked in the context of `this`, or as specified by `context`.
        // 
        // Callbacks bound to superstates and protostates are also invoked, unless otherwise
        // directed by setting `viaSuper` or `viaProto` to `false`.
        // 
        // *Alias:* **trigger**
        emit: function ( events ) {
            return function (
                 /*String*/ eventType,
                  /*Array*/ args,      // = []
                  /*State*/ context,   // = this
                /*Boolean*/ viaSuper,  // = true
                /*Boolean*/ viaProto   // = true
            ) {
                var e, protostate, superstate;

                if ( typeof eventType !== 'string' ) return;

                typeof args === 'boolean' &&
                    ( viaProto = viaSuper, viaSuper = context, context = args, args = undefined );
                typeof context === 'boolean' &&
                    ( viaProto = viaSuper, viaSuper = context, context = undefined );

                !args && ( args = [] ) || Z.isArray( args ) || ( args = [ args ] );
                viaSuper === undefined && ( viaSuper = true );
                viaProto === undefined && ( viaProto = true );

                ( e = events[ eventType ] ) && e.emit( args, context || this );

                viaProto && ( protostate = this.protostate() ) &&
                    protostate.emit( eventType, args, context || this, false );

                viaSuper && ( superstate = this.superstate() ) &&
                    superstate.emit( eventType, args, context || superstate );
            };
        },

        // <a name="state--privileged--guard" href="#state--privileged--guard">&#x1f517;</a>
        // 
        // #### guard
        // 
        // Gets a **guard** entity for this state. A guard is a value or function that will be
        // evaluated, as either a boolean or predicate, respectively, to provide a determination
        // of whether a controller will be admitted into or released from the state to which the
        // guard is applied. Guards are inherited from protostates, but not from superstates.
        // 
        // *See also:* [`StateController evaluateGuard`](#state-controller--private--evaluate-guard)
        guard: function ( guards ) {
            return function ( /*String*/ guardType ) {
                var guard, protostate;

                return (
                    ( guard = guards[ guardType ] ) && Z.clone( guard )
                        ||
                    ( protostate = this.protostate() ) && protostate.guard( guardType )
                        ||
                    undefined
                );
            };
        },

        // <a name="state--privileged--add-guard" href="#state--privileged--add-guard">&#x1f517;</a>
        // 
        // #### addGuard
        // 
        // Adds a guard to this state, or augments an existing guard with additional entries.
        addGuard: function ( guards ) {
            return function ( /*String*/ guardType, /*Object*/ guard ) {
                return Z.edit( guards[ guardType ] || ( guards[ guardType ] = {} ), guard );
            };
        },

        // <a name="state--privileged--remove-guard"
        //    href="#state--privileged--remove-guard">&#x1f517;</a>
        // 
        // #### removeGuard
        // 
        // Removes a guard from this state, or removes specific entries from an existing guard.
        removeGuard: function ( guards ) {
            return function (
                        /*String*/ guardType
                /*Array | String*/ /* keys... */
            ) {
                var guard, keys, i, l, key, entry;

                guard = guards[ guardType ];
                if ( !guard ) return null;

                if ( arguments.length < 2 ) return delete guards[ guardType ] ? guard : undefined;

                keys = Z.flatten( Z.slice.call( arguments, 1 ) );
                for ( i = 0, l = keys.length; i < l; i++ ) {
                    key = keys[i];
                    if ( typeof key === 'string' && delete( entry = guard[ key ] ) ) return entry;
                }
            };
        },

        // <a name="state--privileged--substate" href="#state--privileged--substate">&#x1f517;</a>
        // 
        // #### substate
        // 
        // Retrieves the named substate of `this` state. If no such substate exists in the local
        // state, any identically named substate held on a protostate will be returned.
        substate: function ( substates ) {
            return function (
                 /*String*/ stateName,
                /*Boolean*/ viaProto    // = true
            ) {
                var s = this.current(),
                    ss, protostate;

                viaProto === undefined && ( viaProto = true );

                // First scan for any virtual substates that are active on the local controller.
                for ( ; s && s.isVirtual() && ( ss = s.superstate() ); s = ss ) {
                    if ( ss === this && s.name() === stateName ) return s; 
                }

                // Otherwise retrieve a real substate, either locally or from a protostate.
                return (
                    substates && substates[ stateName ]
                        ||
                    viaProto && ( protostate = this.protostate() ) &&
                            protostate.substate( stateName )
                        ||
                    undefined
                );
            };
        },

        // <a name="state--privileged--substates" href="#state--privileged--substates">&#x1f517;</a>
        // 
        // #### substates
        // 
        // Returns an `Array` of this state’s substates. If the boolean `deep` argument is `true`,
        // returns a depth-first flattened array containing all of this state’s descendant states.
        substates: function ( substates ) {
            return function (
                /*Boolean*/ deep,    // = false
                /*Boolean*/ virtual  // = false
            ) {
                var result = [],
                    s, ss, key;

                // Include virtual substates, if present.
                if ( virtual ) {
                    s = this.current();
                    if ( s && s.isVirtual() && this.isSuperstateOf( s ) ) {
                        while ( s && s !== this && s.isVirtual() && ( ss = s.superstate() ) ) {
                            deep ? result.unshift( s ) : ss === this && result.unshift( s );
                            s = ss;
                        }
                    }
                }

                // Include real substates.
                for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
                    result.push( substates[ key ] );
                    deep && ( result = result.concat( substates[ key ].substates( true ) ) );
                }

                return result;
            };
        },

        // <a name="state--privileged--add-substate"
        //    href="#state--privileged--add-substate">&#x1f517;</a>
        // 
        // #### addSubstate
        // 
        // Creates a state from the supplied `stateExpression` and adds it as a substate of
        // this state. If a substate with the same `stateName` already exists, it is first
        // destroyed and then replaced. If the new substate is being added to the controller’s
        // root state, a reference is added directly on the controller itself as well.
        addSubstate: function ( substates ) {
            return function (
                /*String*/ stateName,
                /*StateExpression | Object | State*/ stateExpression
            ) {
                var substate, controller;

                if ( this.isVirtual() ) {
                    return this.realize().addSubstate( stateName, stateExpression );
                }
                if ( this.isSealed() ) return null;

                ( substate = substates[ stateName ] ) && substate.destroy();

                substate = stateExpression instanceof State ?
                    stateExpression.superstate() === this && stateExpression.realize() :
                    new State( this, stateName, stateExpression );

                if ( !substate ) return null;

                this[ stateName ] = substates[ stateName ] = substate;

                controller = this.controller();
                controller.root() === this && ( controller[ stateName ] = substate );

                return substate;
            };
        },

        // <a name="state--privileged--remove-substate"
        //    href="#state--privileged--remove-substate">&#x1f517;</a>
        // 
        // #### removeSubstate
        // 
        // Removes the named substate from the local state, if possible.
        removeSubstate: function ( substates ) {
            return function ( /*String*/ stateName ) {
                var controller, current, transition,
                    substate = substates[ stateName ];

                if ( !substate ) return;

                controller = this.controller();
                current = controller.current();

                // If a transition is underway involving `substate`, the removal will fail.
                if (
                    ( transition = controller.transition() )
                        &&
                    (
                        substate.isSuperstateOf( transition ) ||
                        substate === transition.origin() ||
                        substate === transition.target()
                    )
                ) {
                    return false;
                }

                // The controller must be forced to evacuate the state before it is removed.
                current.isIn( substate ) && controller.change( this, { forced: true } );

                delete substates[ stateName ];
                delete this[ stateName ];
                controller.root() === this && delete controller[ stateName ];

                return substate;
            };
        },

        // <a name="state--privileged--transition"
        //    href="#state--privileged--transition">&#x1f517;</a>
        // 
        // #### transition
        // 
        // Returns the named transition expression held on this state.
        transition: function ( transitions ) {
            return function ( /*String*/ transitionName ) {
                return transitions[ transitionName ];
            };
        },

        // <a name="state--privileged--transitions"
        //    href="#state--privileged--transitions">&#x1f517;</a>
        // 
        // #### transitions
        // 
        // Returns an object containing all of the transition expressions defined on this state.
        transitions: function ( transitions ) {
            return function () {
                return Z.clone( transitions );
            };
        },

        // <a name="state--privileged--add-transition"
        //    href="#state--privileged--add-transition">&#x1f517;</a>
        // 
        // #### addTransition
        // 
        // Registers a transition expression to this state.
        addTransition: function ( transitions ) {
            return function (
                /*String*/ transitionName,
                /*TransitionExpression | Object*/ transitionExpression
            ) {
                transitionExpression instanceof TransitionExpression ||
                    ( transitionExpression = TransitionExpression( transitionExpression ) );

                return transitions[ transitionName ] = transitionExpression;
            };
        },

        // <a name="state--privileged--history" href="#state--privileged--history">&#x1f517;</a>
        // 
        // #### history
        // 
        history: function ( history ) {
            return function ( indexDelta ) {
                if ( indexDelta === undefined ) return Z.clone( history );
                return history[ history.index + indexDelta ];
            };
        },

        // <a name="state--privileged--push" href="#state--privileged--push">&#x1f517;</a>
        // 
        // #### push
        // 
        push: function ( history ) {
            return function ( flags, state, transition, data ) {
                var i, previous, current, superstate;

                typeof flags === 'string' ||
                    ( data = transition, transition = state, state = flags, flags = undefined );

                if ( !( state instanceof State && this.has( state ) ) ) return;

                flags = Z.assign( flags );

                i = history.index;
                previous = i === undefined ? null : history[i];

                i = history.index = i === undefined ? 0 : i + 1;
                current = history[i] = {
                    state: state.toString(),
                    transition: undefined,
                    data: undefined
                };

                if ( flags.relative ) {
                    if ( previous ) {
                        current.data = previous.data;
                        previous.data = Z.delta( current.data, data );
                    } else {
                        current.data = Z.clone( data );
                    }
                } else {
                    current.data = Z.clone( data );
                    previous && ( previous.data = Z.diff( previous.data, data ) );
                }

                history.splice( ++i, history.length - i );

                this.isActive() &&
                    ( superstate = this.superstate() ) &&
                    ( superstate = superstate.historian() ) &&
                    superstate.push( state, transition, flags, data );

                1 || state.isCurrent() || this.goTo( state );

                return history.length;
            };
        },

        // <a name="state--privileged--replace" href="#state--privileged--replace">&#x1f517;</a>
        // 
        // #### replace
        // 
        replace: function ( history ) {
            return function ( flags, state, data ) {
                var previous, current, next, delta,
                    i = history.index,
                    l = history.length;

                if ( i === undefined ) {
                    this.push.apply( this, arguments );
                    return this;
                }

                typeof flags === 'string' || ( data = state, state = flags, flags = undefined );

                if ( !state.isIn( this ) ) return;

                flags = Z.assign( flags );

                current = history[i];
                i > 0 && ( previous = history[ i - 1 ] );
                i < l - 1 && ( next = history[ i + 1 ] );

                current.state = state.toString();
                delta = ( flags.relative ? Z.delta : Z.diff )( current.data, data );
                if ( !Z.isEmpty( delta ) ) {
                    previous && Z.edit( true, previous.data, delta );
                    next && Z.edit( true, next.data, delta );
                }
                current.data = Z.clone( data );

                0 && this.goTo( state );

                return this;
            };
        },

        // <a name="state--privileged--destroy" href="#state--privileged--destroy">&#x1f517;</a>
        // 
        // #### destroy
        // 
        // Attempts to cleanly destroy this state and all of its substates. A `destroy` event is
        // issued to each state after it is destroyed.
        destroy: function ( setSuperstate, methods, events, substates ) {
            return function () {
                var superstate = this.superstate(),
                    controller = this.controller(),
                    owner = controller.owner(),
                    transition = controller.transition(),
                    origin, target, key, methodName, delegator, method, stateName;

                // If a transition is underway that involves this state, then the state cannot be
                // destroyed.
                if ( transition ) {
                    origin = transition.origin(), target = transition.target();

                    if ( origin.isIn( this ) || target.isIn( this ) ) return false;
                }

                // Descendant states are destroyed bottom-up.
                for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
                    substates[ stateName ].destroy();
                }

                // `destroy` is the final event emitted.
                this.emit( 'destroy', false );
                for ( key in events ) {
                    events[ key ].destroy();
                    delete events[ key ];
                }

                //
                if ( superstate ) {
                    superstate.removeSubstate( this.name() );
                }

                // When the root state is destroyed, the owner gets back its original methods, and
                // the corresponding delegator for each such method is destroyed.
                else {
                    for ( methodName in methods ) {
                        delegator = owner[ methodName ];
                        method = delegator.original;
                        if ( method ) {
                            delete delegator.original;
                            owner[ methodName ] = method;
                        } else {
                            delete owner[ methodName ];
                        }
                    }

                    // The `destroy` call is propagated to the root’s controller, unless it was
                    // controller itself that instigated the call.
                    controller.destroy && controller.destroy();
                }

                setSuperstate( undefined );

                // A flag is set that can be observed later by anything retaining a reference to
                // this state (e.g. a memoization) which would be withholding it from being
                // garbage-collected. A well-behaved retaining entity should check this flag as
                // necessary to reassert the validity of its reference, and discard the reference
                // after it observes `destroyed` to have been set to `true`.
                return this.destroyed = true;
            };
        }
    };

    // ### Prototype methods
    // 
    // The instance methods defined above are also defined here, either as no-ops or defaults, so
    // as to provide virtual states with a conformant [`State`](#state) interface despite not (or
    // not yet) having been realized.
    createRealizer( State.prototype, 'addMethod addEvent addGuard addSubstate addTransition' );
    Z.privilege( State.prototype, State.privileged, {
        'data method substate substates' : [ null ]
    });
    Z.assign( State.prototype, {
        attributes: Z.thunk( SA.NORMAL ),
        isVirtual:    function () { return !!( this.attributes() & SA.VIRTUAL ); },
        isMutable:    function () { return !!( this.attributes() & SA.MUTABLE ); },
        isInitial:    function () { return !!( this.attributes() & SA.INITIAL ); },
        isConclusive: function () { return !!( this.attributes() & SA.CONCLUSIVE ); },
        isFinal:      function () { return !!( this.attributes() & SA.FINAL ); },
        isAbstract:   function () { return !!( this.attributes() & SA.ABSTRACT ); },
        isDefault:    function () { return !!( this.attributes() & SA.DEFAULT ); },
        isSealed:     function () { return !!( this.attributes() & SA.SEALED ); },
        isRetained:   function () { return !!( this.attributes() & SA.RETAINED ); },
        hasHistory:   function () { return !!( this.attributes() & SA.HISTORY ); },
        isShallow:    function () { return !!( this.attributes() & SA.SHALLOW ); },
        isVersioned:  function () { return !!( this.attributes() & SA.VERSIONED ); },
        isConcurrent: function () { return !!( this.attributes() & SA.CONCURRENT ); },

        'name \
         express mutate \
         superstate \
         removeMethod \
         event removeEvent emit trigger \
         guard removeGuard \
         removeSubstate \
         transition removeTransition' :
            Z.noop,

        realize: Z.getThis,

        methodNames: function () { return []; },
        transitions: function () { return {}; },
        destroy: Z.thunk( false ),


        // <a name="state--prototype--to-string" href="#state--prototype--to-string">&#x1f517;</a>
        // 
        // #### toString
        // 
        // Returns this state’s fully qualified name.
        toString: function () {
            return this.derivation( true ).join('.');
        },

        // <a name="state--prototype--controller" href="#state--prototype--controller">&#x1f517;</a>
        // 
        // #### controller
        // 
        // Gets the [`StateController`](#state-controller) to which this state belongs.
        controller: function () {
            var superstate = this.superstate();
            if ( superstate ) return superstate.controller();
        },

        // <a name="state--prototype--owner" href="#state--prototype--owner">&#x1f517;</a>
        // 
        // #### owner
        // 
        // Gets the owner object to which this state’s controller belongs.
        owner: function () {
            var controller = this.controller();
            if ( controller ) return controller.owner();
        },

        // <a name="state--prototype--root" href="#state--prototype--root">&#x1f517;</a>
        // 
        // #### root
        // 
        // Gets the root state, i.e. the top-level superstate of this state.
        root: function () {
            var controller = this.controller();
            if ( controller ) return controller.root();
        },

        // <a name="state--prototype--current" href="#state--prototype--current">&#x1f517;</a>
        // 
        // #### current
        // 
        // Gets the local controller’s current state.
        current: function () {
            var controller = this.controller();
            if ( controller ) return this.controller().current();
        },

        // <a name="state--prototype--default-substate"
        //    href="#state--prototype--default-substate">&#x1f517;</a>
        // 
        // #### defaultSubstate
        // 
        // Returns the first substate marked `default`, or simply the first substate. Recursion
        // continues into the protostate only if no local descendant states are marked `initial`.
        defaultSubstate: function (
            /*Boolean*/ viaProto, // = true
                           first
        ) {
            var substates = this.substates(),
                i = 0, l = substates && substates.length,
                protostate;

            first || l && ( first = substates[0] );
            for ( ; i < l; i++ ) if ( substates[i].isDefault() ) return substates[i];

            if ( ( viaProto || viaProto === undefined ) && ( protostate = this.protostate() ) ) {
                return protostate.defaultSubstate( true, first );
            }

            return first;
        },

        // <a name="state--prototype--initial-substate"
        //    href="#state--prototype--initial-substate">&#x1f517;</a>
        // 
        // #### initialSubstate
        // 
        // Performs a “depth-within-breadth-first” recursive search to locate the most deeply
        // nested `initial` state by way of the greatest `initial` descendant state. Recursion
        // continues into the protostate only if no local descendant states are marked `initial`.
        initialSubstate: function (
            /*Boolean*/ viaProto // = true
        ) {
            var queue = [ this ],
                subject, substates, i, l, state, protostate;

            while ( subject = queue.shift() ) {
                substates = subject.substates( false, true );
                for ( i = 0, l = substates.length; i < l; i++ ) {
                    state = substates[i];
                    if ( state.isInitial() ) return state.initialSubstate( false ) || state;
                    queue.push( state );
                }
            }

            if ( ( viaProto || viaProto === undefined ) && ( protostate = this.protostate() ) ) {
                return protostate.initialSubstate( true );
            }
        },

        // <a name="state--prototype--protostate" href="#state--prototype--protostate">&#x1f517;</a>
        // 
        // #### protostate
        // 
        // Returns the **protostate**, the state analogous to `this` found in the next object in
        // the owner’s prototype chain that has one. A state inherits first from its protostates,
        // then from its superstates.
        // 
        // If the owner does not share an analogous [`StateController`](#state-controller) with its
        // prototype, or if no protostate can be found in the hierarchy of the prototype’s state
        // controller, then the search is iterated up the prototype chain.
        // 
        // A state and its protostate will always share an identical name and identical derivation
        // pattern, as will the respective superstates of both, relative to one another.
        protostate: function () {
            var derivation = this.derivation( true ),
                controller = this.controller(),
                controllerName, prototype, next, protostate, i, l;

            if ( !controller ) return;

            controllerName = controller.name();
            prototype = controller.owner();

            // Returns the root state of the next `prototype` in the chain.
            next = function () {
                var fn, s;
                prototype = Z.getPrototypeOf( prototype );
                return (
                    prototype &&
                    typeof prototype === 'object' &&
                    Z.isFunction( fn = prototype[ controllerName ] ) &&
                    ( s = fn.apply( prototype ) ) &&
                    s instanceof State &&
                    s.root()
                );
            };

            // Walk up the prototype chain; starting at each prototype’s root state, locate the
            // protostate that corresponds to `this`.
            for ( protostate = next(); protostate; protostate = next() ) {
                for ( i = 0, l = derivation.length; i < l; i++ ) {
                    protostate = protostate.substate( derivation[i], false );
                    if ( !protostate ) break;
                }

                if ( protostate ) {
                    // Before returning the located protostate, memoize subsequent lookups with
                    // an instance method that closes over it.
                    if ( meta.options.memoizeProtostates ) {
                        this.protostate = function () {
                            if ( protostate.destroyed ) {
                                // If `destroyed` has been set, it means we’re hanging onto an
                                // invalid reference, so clear it for GC, and relay this invocation
                                // back up to
                                // [`State.prototype.protostate`](#state--prototype--protostate).
                                protostate = null;
                                delete this.protostate;
                                return this.protostate();
                            }
                            else return protostate;
                        };
                    }

                    return protostate;
                }
            }
        },

        // <a name="state--prototype--derivation" href="#state--prototype--derivation">&#x1f517;</a>
        // 
        // #### derivation
        // 
        // Returns an object array of this state’s superstate chain, starting after the root
        // state and ending at `this`. If `byName` is set to `true`, a string array of the
        // states’ names is returned instead.
        derivation: function ( /*Boolean*/ byName ) {
            for ( var result = [], state, superstate = this;
                    ( state = superstate ) && ( superstate = state.superstate() );
                    result.unshift( byName ? state.name() || '' : state ) );
            return result;
        },

        // <a name="state--prototype--depth" href="#state--prototype--depth">&#x1f517;</a>
        // 
        // #### depth
        // 
        // Returns the number of superstates this state has. The root state returns `0`, its
        // immediate substates return `1`, etc.
        depth: function () {
            for ( var n = 0, s = this, ss; ss = s.superstate(); s = ss, n++ );
            return n;
        },

        // <a name="state--prototype--common" href="#state--prototype--common">&#x1f517;</a>
        // 
        // #### common
        // 
        // Returns the least common ancestor of `this` and `other`. If `this` is itself an ancestor
        // of `other`, or vice versa, that ancestor is returned.
        common: function ( /*State | String*/ other ) {
            var state;
            other instanceof State || ( other = this.query( other ) );
            for (
                this.depth() > other.depth() ?
                    ( state = other, other = this ) :
                    ( state = this );
                state;
                state = state.superstate() 
            ) {
                if ( state === other || state.isSuperstateOf( other ) ) return state;
            }
        },

        // <a name="state--prototype--is" href="#state--prototype--is">&#x1f517;</a>
        // 
        // #### is
        // 
        // Determines whether `this` is `state`.
        is: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this;
        },

        // <a name="state--prototype--is-in" href="#state--prototype--is-in">&#x1f517;</a>
        // 
        // #### isIn
        // 
        // Determines whether `this` is or is a substate of `state`.
        isIn: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this || state.isSuperstateOf( this );
        },

        // <a name="state--prototype--has" href="#state--prototype--has">&#x1f517;</a>
        // 
        // #### has
        // 
        // Determines whether `this` is or is a superstate of `state`.
        has: function ( /*State | String */ state ) {
            state instanceof State || ( state = this.query( state ) );
            return this === state || this.isSuperstateOf( state );
        },

        // <a name="state--prototype--is-superstate-of"
        //    href="#state--prototype--is-superstate-of">&#x1f517;</a>
        // 
        // #### isSuperstateOf
        // 
        // Determines whether `this` is a superstate of `state`.
        isSuperstateOf: function ( /*State | String*/ state ) {
            var superstate;
            state instanceof State || ( state = this.query( state ) );

            return ( superstate = state.superstate() ) ?
                this === superstate || this.isSuperstateOf( superstate ) :
                false;
        },

        // <a name="state--prototype--is-protostate-of"
        //    href="#state--prototype--is-protostate-of">&#x1f517;</a>
        // 
        // #### isProtostateOf
        // 
        // Determines whether `this` is a state analogous to `state` on any object in the prototype
        // chain of `state`’s owner.
        isProtostateOf: function ( /*State | String*/ state ) {
            var protostate;
            state instanceof State || ( state = this.query( state ) );

            return ( protostate = state.protostate() ) ?
                this === protostate || this.isProtostateOf( protostate ) :
                false;
        },

        // <a name="state--prototype--apply" href="#state--prototype--apply">&#x1f517;</a>
        // 
        // #### apply
        // 
        // Finds a state method and applies it in the appropriate context. If the method was
        // originally defined in the owner, the context will be the owner. Otherwise, the context
        // will either be the state in which the method is defined, or if the implementation
        // resides in a protostate, the corresponding inheriting state in the local controller.
        apply: function ( /*String*/ methodName, /*Array*/ args ) {
            var out, method, context, owner, ownerMethod;

            out = { method: undefined, context: undefined };
            method = this.method( methodName, true, true, out );

            if ( !method ) throw new TypeError( "State '" + this + "' has no method '" +
                methodName + "'" );

            context = out.context;
            owner = this.owner();
            ownerMethod = owner[ methodName ];
            if ( ownerMethod && ownerMethod.original && context === this.root() ) {
                context = owner;
            }

            return method.apply( context, args );
        },

        // <a name="state--prototype--call" href="#state--prototype--call">&#x1f517;</a>
        // 
        // #### call
        // 
        // Variadic [`apply`](#state--prototype--apply).
        call: function ( /*String*/ methodName ) {
            return this.apply( methodName, Z.slice.call( arguments, 1 ) );
        },

        // <a name="state--prototype--has-method" href="#state--prototype--has-method">&#x1f517;</a>
        // 
        // #### hasMethod
        // 
        // Determines whether `this` possesses or inherits a method named `methodName`.
        hasMethod: function ( /*String*/ methodName ) {
            var method = this.method( methodName );
            return method && method !== Z.noop;
        },

        // <a name="state--prototype--has-own-method"
        //    href="#state--prototype--has-own-method">&#x1f517;</a>
        // 
        // #### hasOwnMethod
        // 
        // Determines whether `this` directly possesses a method named `methodName`.
        hasOwnMethod: function ( /*String*/ methodName ) {
            return !!this.method( methodName, false, false );
        },

        // <a name="state--prototype--change" href="#state--prototype--change">&#x1f517;</a>
        // 
        // #### change
        // 
        // Forwards a `change` command to the state’s controller and returns its result.
        // Calling with no arguments directs the controller to change to `this` state.
        // 
        // *Aliases:* **go**, **be**
        //
        // *See also:* [`StateController.privileged.change`](#state-controller--privileged--change)
        'change go be': function (
            /*State | String*/ target,  // optional
                    /*Object*/ options  // optional
        ) {
            var controller = this.controller();

            if ( !arguments.length ) return controller.change( this );

            Z.isNumber( target ) && ( target = this.history( target ) );
            return controller.change.apply( controller,
                target instanceof State || typeof target === 'string' ?
                    arguments :
                    [ this ].concat( arguments )
            );
        },

        // <a name="state--prototype--change-to" href="#state--prototype--change-to">&#x1f517;</a>
        // 
        // #### changeTo
        // 
        // Calls `change` without regard to a `target`’s retained internal state.
        // 
        // *Aliases:* **goTo**, **become**
        // 
        // *See also:* [`State.prototype.change`](#state--prototype--change)
        'changeTo goTo become': function (
            /*State | String*/ target,
                    /*Object*/ options  // optional
        ) {
            target === undefined && ( target = this );
            options ? ( options.direct = true ) : ( options = { direct: true } );
            return this.change( target, options );
        },

        // <a name="state--prototype--is-current" href="#state--prototype--is-current">&#x1f517;</a>
        // 
        // #### isCurrent
        // 
        // Returns a `Boolean` indicating whether `this` is the controller’s current state.
        isCurrent: function () {
            return this.current() === this;
        },

        // <a name="state--prototype--is-active" href="#state--prototype--is-active">&#x1f517;</a>
        // 
        // #### isActive
        // 
        // Returns a `Boolean` indicating whether `this` or one of its substates is the
        // controller’s current state.
        isActive: function () {
            var current = this.current();
            return current === this || this.isSuperstateOf( current );
        },

        // <a name="state--prototype--history" href="#state--prototype--history">&#x1f517;</a>
        // 
        // #### history
        // 
        history: function () {
            var h = this.historian();
            if ( h ) return h.history();
        },

        // <a name="state--prototype--historian" href="#state--prototype--historian">&#x1f517;</a>
        // 
        // #### historian
        // 
        // Returns the nearest history-keeping state.
        historian: function () {
            for ( var s = this; s; s = s.superstate() ) if ( s.hasHistory() ) return s;
        },

        push: function ( flags, state, transition, data ) {
            typeof flags === 'string' ||
                ( data = transition, transition = state, state = flags, flags = undefined );

            var historian = this.historian();

            if ( historian ) {
                // Before delegating to the historian, `state` must be resolved locally.
                state instanceof State || ( state = this.query( state ) );

                if ( state && state.isIn( this ) ) {
                    return historian.push( flags, state, transition, data );
                }
            }
        },

        replace: function ( flags, state, transition, data ) {
            var historian = this.historian();

            if ( historian ) {
                // Before delegating to the historian, `state` must be resolved locally.
                state instanceof State || ( state = this.query( state ) );

                if ( state && state.isIn( this ) ) {
                    return historian.push( flags, state, transition, data );
                }
            }
        },

        /** */
        pushHistory: global.history && global.history.pushState ?
            function ( title, urlBase ) {
                return global.history.pushState( this.data, title || this.toString(),
                    urlBase + '/' + this.derivation( true ).join('/') );
            } : Z.noop
        ,

        /** */
        replaceHistory: global.history && global.history.replaceState ?
            function ( title, urlBase ) {
                return global.history.replaceState( this.data, title || this.toString(),
                    urlBase + '/' + this.derivation( true ).join('/') );
            } : Z.noop
        ,

        // <a name="state--prototype--query" href="#state--prototype--query">&#x1f517;</a>
        // 
        // #### query
        // 
        // Matches a string expression `expr` with the state or states it represents, evaluated
        // first in the context of `this`, then its substates, and then its superstates, until
        // all locations in the state tree have been searched for a match of `expr`.
        // 
        // Returns the matched [`State`](#state), or an `Array` containing the set of matched
        // states. If a state to be tested `against` is provided, a `Boolean` is returned,
        // indicating whether `against` is the matched state or is included in the matching set.
        // 
        // Setting `descend` to `false` disables recursion through the substates of `this`, and
        // likewise setting `ascend` to `false` disables the subsequent recursion through its
        // superstates.
        // 
        // *Alias:* **match**
        'query match': function (
             /*String*/ expr,
              /*State*/ against, // optional
            /*Boolean*/ descend, // = true
            /*Boolean*/ ascend,  // = true
            /*Boolean*/ viaProto // = true
        ) {
            var parts, cursor, next, result, i, l, name,
                queue, subject, substates, state, superstate, protostate;

            if ( typeof against === 'boolean' ) {
                ascend = descend, descend = against, against = undefined;
            }
            descend === undefined && ( descend = true );
            ascend === undefined && ( ascend = true );
            viaProto === undefined && ( viaProto = true );

            // A few exceptional cases may be resolved early.
            if ( expr == null ) return against !== undefined ? false : null;
            if ( expr === '.' ) return against !== undefined ? against === this : this;
            if ( expr === '' ) {
                return against !== undefined ? against === this.root() : this.root();
            }

            // Absolute wildcard expressions compared against the root state pass immediately.
            if ( against && against === this.root() && expr.search(/^\*+$/) === 0 ) return true;

            // Pure `.`/`*` expressions should not be recursed.
            expr.search(/^\.*\**$/) === 0 && ( descend = ascend = false );

            // If `expr` is an absolute path, evaluate it from the root state as a relative path.
            if ( expr.charAt(0) !== '.' ) {
                return this.root().query( '.' + expr, against, descend, false );
            }

            // An all-`.` `expr` must have one `.` trimmed to parse correctly.
            expr = expr.replace( /^(\.+)\.$/, '$1' );

            // Split `expr` into tokens, consume the leading empty-string straight away, then
            // parse the remaining tokens. A `cursor` reference to a matching [`State`](#state) in
            // the tree is kept, beginning with the context state (`this`), and updated as each
            // token is consumed.
            parts = expr.split('.');
            for ( i = 1, l = parts.length, cursor = this; cursor; i++ ) {

                // Upon reaching the end of the token stream, return the [`State`](#state)
                // currently referenced by `cursor`.
                if ( i >= l ) return against ? against === cursor : cursor;

                // Consume a token.
                name = parts[i];

                // Interpret a **single wildcard** as any *immediate* substate of the `cursor`
                // state parsed thus far.
                if ( name === '*' ) {
                    if ( !against ) return cursor.substates();
                    else if ( cursor === against.superstate() ) return true;
                    else break;
                }

                // Interpret a **double wildcard** as any descendant state of the `cursor` state
                // parsed thus far.
                else if ( name === '**' ) {
                    if ( !against ) return cursor.substates( true );
                    else if ( cursor.isSuperstateOf( against ) ) return true;
                    else break;
                }

                // Empty string, the product of leading/consecutive dots, implies `cursor`’s
                // superstate.
                else if ( name === '' ) {
                    cursor = cursor.superstate();
                }

                // Interpret any other token as an identifier that names a specific substate of
                // `cursor`.
                else if ( next = cursor.substate( name ) ) {
                    cursor = next;
                }

                // If no matching substate exists, the query fails for this context.
                else break;
            }

            // If the query has failed, then recursively descend the tree, breadth-first, and
            // retry the query with a different context.
            if ( descend ) {
                queue = [ this ];
                while ( subject = queue.shift() ) {
                    substates = subject.substates( false, true );
                    for ( i = 0, l = substates.length; i < l; i++ ) {
                        state = substates[i];

                        // The `ascend` block uses `descend` to indicate a substate that has
                        // already been searched.
                        if ( state === descend ) continue;

                        result = state.query( expr, against, false, false, false );
                        if ( result ) return result;

                        queue.push( state );
                    }
                }
            }

            // If the query still hasn’t succeeded, then recursively ascend the tree and retry,
            // but also passing `this` as a domain to be skipped during the superstate’s
            // subsequent descent.
            if ( ascend && ( superstate = this.superstate() ) ) {
                result = superstate.query( expr, against, descend && this, true, false );
                if ( result ) return result;
            }

            // If the query still hasn’t succeeded, then retry the query on the protostate.
            if ( viaProto && ( protostate = this.protostate() ) ) {
                result = protostate.query( expr, against, descend, ascend, true );
                if ( result ) return result;
            }

            // All possibilities exhausted; no matches exist.
            return against ? false : null;
        },

        // <a name="state--prototype--$" href="#state--prototype--$">&#x1f517;</a>
        // 
        // #### $
        // 
        // Convenience method that either aliases to [`change`](#state--prototype--change) if
        // passed a function for the first argument, or aliases to
        // [`query`](#state--prototype--query) if passed a string — thereby mimicking the behavior
        // of the object’s accessor method.
        // 
        // *See also:*
        // [`StateController createAccessor`](#state-controller--private--create-accessor)
        $: function ( expr ) {
            var args;
            if ( typeof expr === 'function' ) {
                args = Z.slice.call( arguments );
                args[0] = expr = expr();
                if ( expr ) return this.change.apply( this, args );
            }
            else return this.query.apply( this, arguments );
        }
    });
    Z.alias( State.prototype, { addEvent: 'on bind', removeEvent: 'off unbind' } );

    return State;
})();
