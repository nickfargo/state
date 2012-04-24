// ## State <a name="state" href="#state">&#x1f517;</a>
// 
// A **state** models a set of behaviors for an owner object. The owner may undergo **transitions**
// that change its **current** state from one to another, and in so doing adopt a different set of
// behaviors.
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
    var SA = STATE_ATTRIBUTES;

    Z.assign( State, SA );

    // ### Constructor
    function State ( superstate, name, expression ) {
        if ( !( this instanceof State ) ) {
            return new State( superstate, name, expression );
        }
        
        var attributes = expression && expression.attributes || SA.NORMAL;
        
        // #### attributes
        // 
        // Returns the bit field of this state’s attributes.
        this.attributes = function () { return attributes; };

        // #### name
        // 
        // Returns the local name of this state.
        this.name = Z.stringFunction( function () { return name || ''; } );

        // The only further requirement for a virtual state is a method that may be called later
        // which will convert the virtual state into a real state.
        if ( attributes & SA.VIRTUAL ) {
            this.superstate = State.privileged.superstate( superstate );

            // #### realize
            // 
            // Virtual states are weakly bound to a state hierarchy by their reference held at
            // `superstate`; they are not proper members of the superstate’s set of substates. The
            // `realize` method allows a virtual state to transform itself at some later time into
            // a “real” state, with its own set of closed properties and methods, existing
            // thereafter as an abiding member of its superstate’s set of substates.
            this.realize = function ( expression ) {
                delete this.realize;
                attributes &= ~SA.VIRTUAL;

                superstate.addSubstate( name, this ) &&
                    realize.call( this, superstate, attributes, expression );
                
                return this;
            };
        }

        // Do the full setup required for a real state.
        else {
            realize.call( this, superstate, attributes, expression );
        }
    }

    // ### Class-private functions

    // #### realize
    // 
    // Much of the initialization for `State` is offloaded from the constructor, allowing for
    // creation of lightweight virtual `State` instances that inherit all of their functionality
    // from protostates, but can also be converted later to a real `State` if necessary.
    function realize ( superstate, attributes, expression ) {
        var data = {},
            methods = {},
            events = {},
            guards = {},
            substates = {},
            transitions = {},
            history = attributes & SA.HISTORY || attributes & SA.RETAINED ? [] : null;
        
        // (Exposed for debugging.)
        Z.env.debug && Z.assign( this.__private__ = {}, {
            attributes: attributes,
            data: data,
            methods: methods,
            events: events,
            guards: guards,
            substates: substates,
            transitions: transitions
        });
        
        function setSuperstate ( value ) { return superstate = value; }
        
        // Method names are mapped to specific local variables. The named methods are created on
        // `this`, each of which is a partial application of its corresponding method factory at
        // `State.privileged`.
        Z.privilege( this, State.privileged, {
            'init' : [ StateExpression ],
            'mutate express' : [ StateExpression, data, methods, events, guards, substates,
                transitions ],
            'superstate' : [ superstate ],
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

        // If no superstate is given, e.g. for a root state being created by a `StateController`,
        // then `init()` must be called later by the implementor.
        superstate && this.init( expression );

        return this;
    }

    // #### createRealizer
    // 
    // Creates a method that will first realize the state and then, under the assumption that
    // realization has produced a new method of the same name on the instance, invoke the method.
    function createRealizer ( obj, names ) {
        Z.forEach( Z.trim( names ).split( Z.regexp.whitespace ), function ( name ) {
            obj[ name ] = function () { return this.realize()[ name ].apply( this, arguments ); };
        });
    }

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
    // Stateful methods are applied in the context of the `State` to which they belong, or, if a
    // method is inherited from a protostate, the context will be the corresponding virtual state
    // within the local `StateController`. However, for any a priori methods relocated to the root
    // state, the context appropriately remains bound to the owner object.
    // 
    // *See also:* `State.privileged.addMethod`
    function createDelegator ( accessorKey, methodName, original ) {
        function delegator () {
            return this[ accessorKey ]().apply( methodName, arguments );
        }
        
        delegator.isDelegator = true;
        original && ( delegator.original = original );

        return delegator;
    }

    // ### Privileged methods
    // 
    // Methods defined here are partially applied from within a constructor.
    State.privileged = {

        // #### init
        // 
        // Builds out the state’s members based on the expression provided.
        init: function ( /*Function*/ expressionConstructor ) {
            return function ( /*<expressionConstructor> | Object*/ expression ) {
                this.__initializing__ = true;
                this.mutate( expression );
                delete this.__initializing__;
                this.emit( 'construct', { expression: expression }, false );
                return this;
            };
        },

        // #### express
        // 
        // Returns an expression that describes the state’s contents. By default the returned
        // expression is a plain `Object`; if `typed` is truthy the expression is a formally
        // typed `StateExpression`.
        express: function (
            /*Function*/ expressionConstructor,
              /*Object*/ data, methods, events, guards, substates, transitions
        ) {
            function clone ( obj ) {
                if ( obj === undefined ) return;
                return Z.isEmpty( obj = Z.clone( obj ) ) ? null : obj;
            }

            function cloneEvents () {
                if ( events === undefined ) return;
                var out = null, type, collection;
                for ( type in events ) if ( collection = events[ type ] ) {
                    ( out || ( out = {} ) )[ type ] = Z.clone( collection.items );
                }
                return out;
            }

            function recurse ( typed ) {
                if ( substates === undefined ) return;
                var out = null;
                Z.forEach( substates, function ( substate, name ) {
                    ( out || ( out = {} ) )[ name ] = substate.express( typed );
                });
                return out;
            }

            return function ( /*Boolean*/ typed ) {
                var expression = {},
                    attributes = this.attributes();

                Z.edit( expression, {
                    attributes:  this.attributes(),
                    data:        clone( data ),
                    methods:     clone( methods ),
                    events:      cloneEvents(),
                    guards:      clone( guards ),
                    states:      recurse( typed ),
                    transitions: clone( transitions )
                });

                return typed ? new expressionConstructor( expression ) : expression;
            };
        },

        // #### mutate
        // 
        // Transactionally mutates the state by adding, updating, or removing items as specified
        // by the expression provided in `expr`. 
        mutate: function (
            /*Function*/ expressionConstructor,
              /*Object*/ data, methods, events, guards, substates, transitions
        ) {
            return function ( /*<expressionConstructor> | Object*/ expr ) {
                expr instanceof expressionConstructor ||
                    ( expr = new expressionConstructor( expr ) );
                
                var self = this,
                    NIL = Z.NIL,
                    delta, collection, name, value;

                this.__initializing__ || ( delta = Z.diff( expr, this.express() ) );

                this.__atomic__ = true;

                // Data is already set up to handle differentials that contain `NIL` values.
                expr.data && this.data( expr.data );

                // Methods are stored as a simple key mapping, and `addMethod` can be used both
                // to create an entry and to update an existing entry, without any additional
                // side-effects, so method expressions can simply be compared against the `NIL`
                // value.
                collection = expr.methods;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    value !== NIL ? this.addMethod( name, value ) : this.removeMethod( name );
                }

                // Event listeners for a given event type might be expressed as a simple `Array`
                // of items to be added, as a plain `Object` that maps items to specific keys in
                // the internal event collection that should be updated or deleted, or as an
                // `Array` that also includes one or more such `Object`s.
                expr.events && Z.forEach( expr.events, function ( value, type ) {
                    var eventCollection = events[ type ],
                        valueIsArray, items, edit, add, i, l, array;

                    if ( value === NIL ) return eventCollection && eventCollection.empty();

                    valueIsArray = Z.isArray( value );

                    // If an event collection object does not already exist for this event type,
                    // then one will be created, so long as `value` is expected to contain items
                    // to be added.
                    if ( !eventCollection && valueIsArray && value.length ) {
                        eventCollection = events[ type ] = new StateEventCollection( self, type );
                    }

                    items = eventCollection.items;

                    edit = function ( object ) {
                        var key, value;
                        for ( key in object ) {
                            value = object[ key ];
                            if ( value === NIL ) {
                                eventCollection.remove( key );
                            } else if ( value && key in items && value !== items[ key ] ) {
                                items[ key ] = value;
                            }
                        }
                    };

                    if ( valueIsArray ) {
                        add = function ( object ) { return self.addEvent( type, object ); };
                        for ( array = value, i = 0, l = array.length; i < l; i++ ) {
                            value = array[i];
                            if ( value == null || value === NIL ) continue;
                            ( Z.isPlainObject( value ) ? edit : add )( value );
                        }
                    } else if ( Z.isPlainObject( value ) ) {
                        edit( value );
                    }
                });

                // Guards are stored as simple objects, and altering them causes no side-effects,
                // so a deep `edit` is sufficient.
                expr.guards && Z.edit( 'deep', guards, expr.guards );

                // Substates are instances of `State`, which are either created, destroyed, or
                // recursively updated in place, as specified by `expr.states`.
                collection = expr.states;
                for ( name in collection ) if ( Z.hasOwn.call( collection, name ) ) {
                    value = collection[ name ];
                    if ( name in substates ) {
                        value === NIL ?
                            substates[ name ].destroy() :
                            substates[ name ].mutate( value );
                    } else {
                        this.addSubstate( name, value );
                    }
                }

                // Transitions are instances of `TransitionExpression`, which are either created,
                // deleted, or replaced, as specified by `expr.transitions`.
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

                delta && !Z.isEmpty( delta ) && this.emit( 'mutate', [ expr, delta ], false );

                return this;
            };
        },

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

        // #### methodNames
        // 
        // Returns an `Array` of names of methods defined for this state.
        methodNames: function ( methods ) {
            return function () {
                return Z.keys( methods );
            };
        },

        // #### addMethod
        // 
        // Adds a method to this state, which will be callable directly from the owner, but with
        // its context bound to the state.
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

        // #### event
        // 
        // Gets a registered event handler.
        event: function ( events ) {
            return function (
                        /*String*/ eventType,
             /*String | Function*/ id
            ) {
                var collection = events[ eventType ];
                typeof id === 'function' && ( id = collection.key( id ) );
                return collection.get( id );
            };
        },

        // #### addEvent
        // 
        // Binds an event handler to the specified `eventType` and returns a unique identifier
        // for the handler. Built-in event types are listed at `StateEvent.types`.
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

        // #### removeEvent
        // 
        // Unbinds the event handler with the specified `id` that was supplied by `addEvent`.
        // 
        // *Aliases:* **off**, **unbind**
        removeEvent: function ( events ) {
            return function ( /*String*/ eventType, /*String*/ id ) {
                return events[ eventType ].remove( id );
            };
        },

        // #### emit
        // 
        // Invokes all callbacks bound to the given event type.
        //
        // Arguments for the callbacks can be passed as an array to the `args` parameter.
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

        // #### guard
        // 
        // Gets a **guard** entity for this state. A guard is a value or function that will be
        // evaluated, as either a boolean or predicate, respectively, to provide a determination
        // of whether a controller will be admitted into or released from the state to which the
        // guard is applied. Guards are inherited from protostates, but not from superstates.
        // 
        // *See also:* `StateController::evaluateGuard`
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

        // #### addGuard
        // 
        // Adds a guard to this state, or augments an existing guard with additional entries.
        addGuard: function ( guards ) {
            return function ( /*String*/ guardType, /*Object*/ guard ) {
                return Z.edit( guards[ guardType ] || ( guards[ guardType ] = {} ), guard );
            };
        },

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

        // #### substate
        // 
        // Retrieves the named substate of `this` state. If no such substate exists in the local
        // state, any identically named substate held on a protostate will be returned.
        substate: function ( substates ) {
            return function ( /*String*/ stateName, /*Boolean*/ viaProto ) {
                var s = this.current(),
                    ss, protostate;
                
                viaProto === undefined && ( viaProto = true );

                // First scan for any virtual substates that are current on the local controller.
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

        // #### substates
        // 
        // Returns an `Array` of this state’s substates. If the boolean `deep` argument is `true`,
        // returns a depth-first flattened array containing all of this state’s descendant states.
        substates: function ( substates ) {
            return function ( /*Boolean*/ deep ) {
                var result = [],
                    key;
                
                for ( key in substates ) if ( Z.hasOwn.call( substates, key ) ) {
                    result.push( substates[ key ] );
                    deep && ( result = result.concat( substates[ key ].substates( true ) ) );
                }

                return result;
            };
        },

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
                
                if ( !substate ) return;
                
                this[ stateName ] = substates[ stateName ] = substate;
                
                controller = this.controller();
                controller.root() === this && ( controller[ stateName ] = substate );
                
                return substate;
            };
        },

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

        // #### transition
        // 
        // Returns the named transition expression held on this state.
        transition: function ( transitions ) {
            return function ( /*String*/ transitionName ) {
                return transitions[ transitionName ];
            };
        },

        // #### transitions
        // 
        // Returns an object containing all of the transition expressions defined on this state.
        transitions: function ( transitions ) {
            return function () {
                return Z.clone( transitions );
            };
        },

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

        // #### history
        // 
        history: function ( history ) {
            return function ( indexDelta ) {
                if ( indexDelta === undefined ) return Z.clone( history );
                return history[ history.index + indexDelta ];
            };
        },

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

                // Emit a `destroy` event on the local state.
                this.emit( 'destroy', false );
                for ( key in events ) {
                    events[ key ].destroy();
                    delete events[ key ];
                }

                if ( superstate ) {
                    superstate.removeSubstate( this.name() );
                }
                // This is the root state, so restore any original methods to the owner and
                // delete any delegators.
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
                }
                for ( stateName in substates ) if ( Z.hasOwn.call( substates, stateName ) ) {
                    substates[ stateName ].destroy();
                }
                setSuperstate( undefined );

                return true;
            };
        }
    };

    // ### Prototype methods
    // 
    // The instance methods defined above are also defined here, either as no-ops or defaults, so
    // as to provide virtual states with a conformant `State` interface despite not (or not yet)
    // having been realized.
    createRealizer( State.prototype, 'addMethod addEvent addGuard addSubstate addTransition' );
    Z.privilege( State.prototype, State.privileged, { 'data method substate' : [ null ] } );
    Z.assign( State.prototype, {
        attributes: Z.thunk( SA.NORMAL ),
        isVirtual:    function () { return !!( this.attributes() & SA.VIRTUAL ); },
        isInitial:    function () { return !!( this.attributes() & SA.INITIAL ); },
        isDefault:    function () { return !!( this.attributes() & SA.DEFAULT ); },
        isFinal:      function () { return !!( this.attributes() & SA.FINAL ); },
        isAbstract:   function () { return !!( this.attributes() & SA.ABSTRACT ); },
        isSealed:     function () { return !!( this.attributes() & SA.SEALED ); },
        isRetained:   function () { return !!( this.attributes() & SA.RETAINED ); },
        hasHistory:   function () { return !!( this.attributes() & SA.HISTORY ); },
        isShallow:    function () { return !!( this.attributes() & SA.SHALLOW ); },
        isVersioned:  function () { return !!( this.attributes() & SA.VERSIONED ); },
        isConcurrent: function () { return !!( this.attributes() & SA.CONCURRENT ); },

        'name \
         init express mutate \
         superstate \
         removeMethod \
         event removeEvent emit trigger \
         guard removeGuard \
         removeSubstate \
         transition removeTransition' :
            Z.noop,
        
        realize: Z.getThis,

        'methodNames substates': function () { return []; },
        transitions: function () { return {}; },
        destroy: Z.thunk( false ),


        // #### toString
        // 
        // Returns this state’s fully qualified name.
        toString: function () {
            return this.derivation( true ).join('.');
        },
        
        // #### controller
        // 
        // Gets the `StateController` to which this state belongs.
        controller: function () {
            var superstate = this.superstate();
            if ( superstate ) return superstate.controller();
        },
        
        // #### owner
        // 
        // Gets the owner object to which this state’s controller belongs.
        owner: function () {
            var controller = this.controller();
            if ( controller ) return controller.owner();
        },
        
        // #### root
        // 
        // Gets the root state, i.e. the top-level superstate of this state.
        root: function () {
            var controller = this.controller();
            if ( controller ) return controller.root();
        },
        
        // #### current
        // 
        // Gets the local controller’s current state.
        current: function () {
            var controller = this.controller();
            if ( controller ) return this.controller().current();
        },

        // #### defaultSubstate
        // 
        // Returns the first substate marked `default`, or simply the first substate.
        defaultSubstate: function () {
            var substates = this.substates(), i = 0, l = substates && substates.length;
            if ( !l ) return;
            for ( ; i < l; i++ ) if ( substates[i].isDefault() ) return substates[i];
            return substates[0];
        },

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
                substates = subject.substates();
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

        // #### protostate
        // 
        // Returns the **protostate**, the state analogous to `this` found in the next object in
        // the owner’s prototype chain that has one. A state inherits from both its protostate and
        // superstate, *in that order*.
        // 
        // If the owner does not share an analogous `StateController` with its prototype, or if no
        // protostate can be found in the hierarchy of the prototype’s state controller, then the
        // search is iterated up the prototype chain.
        // 
        // A state and its protostate will always share an identical name and identical derivation
        // pattern, as will the respective superstates of both, relative to one another.
        protostate: function () {
            var derivation = this.derivation( true ),
                controller = this.controller(),
                controllerName, owner, prototype, protostate, i, l, stateName;
            
            function iterate () {
                var fn, c;
                prototype = Z.getPrototypeOf( prototype );
                protostate = prototype &&
                    typeof prototype === 'object' &&
                    Z.isFunction( fn = prototype[ controllerName ] ) &&
                    ( c = fn.apply( prototype ) ) &&
                    c instanceof State ?
                        c.root() :
                        null;
            }
            
            if ( !controller ) return;

            controllerName = controller.name();
            prototype = owner = controller.owner();
        
            for ( iterate(); protostate; iterate() ) {
                for ( i = 0, l = derivation.length; i < l; i++ ) {
                    protostate = protostate.substate( derivation[i], false );
                    if ( !protostate ) return;
                }
                return protostate;
            }
        },

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

        // #### depth
        // 
        // Returns the number of superstates this state has. The root state returns `0`, its
        // immediate substates return `1`, etc.
        depth: function () {
            for ( var n = 0, s = this, ss; ss = s.superstate(); s = ss, n++ );
            return n;
        },

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
        
        // #### is
        // 
        // Determines whether `this` is `state`.
        is: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this;
        },

        // #### isIn
        // 
        // Determines whether `this` is or is a substate of `state`.
        isIn: function ( /*State | String*/ state ) {
            state instanceof State || ( state = this.query( state ) );
            return state === this || state.isSuperstateOf( this );
        },
        
        // #### has
        // 
        // Determines whether `this` is or is a superstate of `state`.
        has: function ( /*State | String */ state ) {
            state instanceof State || ( state = this.query( state ) );
            return this === state || this.isSuperstateOf( state );
        },

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
        
        // #### call
        // 
        // Variadic `apply`.
        call: function ( /*String*/ methodName ) {
            return this.apply( methodName, Z.slice.call( arguments, 1 ) );
        },
        
        // #### hasMethod
        // 
        // Determines whether `this` possesses or inherits a method named `methodName`.
        hasMethod: function ( /*String*/ methodName ) {
            var method = this.method( methodName );
            return method && method !== Z.noop;
        },
        
        // #### hasOwnMethod
        // 
        // Determines whether `this` directly possesses a method named `methodName`.
        hasOwnMethod: function ( /*String*/ methodName ) {
            return !!this.method( methodName, false, false );
        },

        // #### change
        // 
        // Forwards a `change` command to the state’s controller and returns its result.
        // Calling with no arguments directs the controller to change to `this` state.
        // 
        // *Aliases:* **be**, **become**, **go**, **goTo**
        //
        // *See also:* [`StateController.privileged.change`](#state-controller--privileged--change)
        'change be become go goTo': function ( /*State | String*/ target ) {
            var controller = this.controller();
            return (
                typeof target === 'string' || target instanceof State ?
                    controller.change.apply( controller, arguments ) :
                arguments.length ?
                    controller.change.apply( controller, [ this ].concat( arguments ) ) :
                controller.change.call( controller, this )
            );
        },
        
        // #### isCurrent
        // 
        // Returns a `Boolean` indicating whether `this` is the controller’s current state.
        isCurrent: function () {
            return this.current() === this;
        },
        
        // #### isActive
        // 
        // Returns a `Boolean` indicating whether `this` or one of its substates is the
        // controller’s current state.
        isActive: function () {
            var current = this.current();
            return current === this || this.isSuperstateOf( current );
        },
        
        // #### history
        // 
        history: function () {
            var h = this.historian();
            if ( h ) return h.history();
        },

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

        // #### query
        // 
        // Matches a string expression `expr` with the state or states it represents, evaluated
        // first in the context of `this`, then its substates, and then its superstates, until
        // all locations in the state tree have been searched for a match of `expr`.
        // 
        // Returns the matched `State`, or an `Array` containing the set of matched states. If a
        // state to be tested `against` is provided, a `Boolean` is returned, indicating whether
        // `against` is the matched state or is included in the matching set.
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
            /*Boolean*/ ascend // = true
        ) {
            var parts, cursor, next, result, i, l, name,
                queue, subject, substates, state, superstate;
            
            // A few exceptional cases may be resolved early.
            if ( expr == null ) return false;
            if ( expr === '' ) return this.root();

            if ( typeof against === 'boolean' ) {
                ascend = descend, descend = against, against = undefined;
            }
            descend === undefined && ( descend = true );
            ascend === undefined && ( ascend = true );

            // Absolute wildcard expressions compared against the root state pass immediately.
            if ( against && against === this.root() && expr.search(/^\*+$/) === 0 ) return true;

            // Wildcard-only expressions need not be recursed.
            expr.search(/^\.?\*+$/) === 0 && ( descend = ascend = false );

            // If `expr` is an absolute path, evaluate it from the root state as a relative path.
            if ( expr.charAt(0) !== '.' ) {
                return this.root().query( '.' + expr, against, descend, false );
            }

            // Lex `expr` into tokens simply by splitting against the `.` separator, and consuming
            // the leading `.` straight away.
            ( parts = expr.split('.') ).shift();

            // Parse the remaining tokens using a loose “grammar”. A `cursor` reference to a
            // matching `State` in the tree is kept, beginning with the context state (`this`),
            // and updated as each token is consumed.
            for ( i = 0, l = parts.length, cursor = this; ; i++ ) {

                // Upon reaching the end of the token stream, return the `State` currently
                // referenced by `cursor`.
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
                if ( name === '**' ) {
                    if ( !against ) return cursor.substates( true );
                    else if ( cursor.isSuperstateOf( against ) ) return true;
                    else break;
                }

                // Empty string, the product of leading/consecutive dots, implies `cursor`’s
                // superstate.
                if ( name === '' && ( next = cursor.superstate() ) ) {
                    cursor = next;
                    continue;
                }

                // Interpret any other token as an identifier that names a specific substate of
                // `cursor`.
                if ( next = cursor.substate( name ) ) {
                    cursor = next;
                    continue;
                }

                // If no matching substate exists, the query fails for this context.
                break;
            }

            // If the query has failed, then recursively descend the tree, breadth-first, and
            // retry the query with a different context.
            if ( descend ) {
                queue = [ this ];
                while ( subject = queue.shift() ) {
                    substates = subject.substates();
                    for ( i = 0, l = substates.length; i < l; i++ ) {
                        state = substates[i];

                        // The `ascend` block uses `descend` to indicate a substate that has
                        // already been searched.
                        if ( state === descend ) continue;

                        result = state.query( expr, against, false, false );
                        if ( result ) return result;

                        queue.push( state );
                    }
                }
            }

            // If the query still hasn’t succeeded, then recursively ascend the tree and retry,
            // but also passing `this` as a domain to be skipped during the superstate’s
            // subsequent descent.
            if ( ascend && ( superstate = this.superstate() ) ) {
                result = superstate.query( expr, against, descend && this, true );
                if ( result ) return result;
            }

            // All possibilities exhausted; no matches exist in this state’s tree.
            return against ? false : null;
        },

        // #### $
        // 
        // Convenience method that either aliases to `change` if passed a function for the first
        // argument, or aliases to `query` if passed a string — thereby mimicking the behavior of
        // the object’s accessor method.
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
