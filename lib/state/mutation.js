// ### [`state/mutation.js`](#state--mutation.js)

// #### [mutate](#state--privileged--mutate)
// 
// Transactionally mutates the state by adding, updating, or removing items
// as specified by the expression provided in `expr`. 
State.privileged.mutate = function (
    /*Function*/ ExpressionConstructor,
      /*Number*/ attributes,
      /*Object*/ data, methods, events, guards, substates, transitions
) {
    return function (
        /*<expressionConstructor> | Object*/ expr
    ) {
        expr instanceof ExpressionConstructor ||
            ( expr = new ExpressionConstructor( expr ) );

        var self = this,
            NIL = O.NIL,
            before, emitter, name, value, after, delta;

        var addMethod, removeMethod;

        // The privileged `init` method uses `mutate` for the state’s
        // initial build, but with the resultant `mutate` event suppressed.
        if ( !this.__initializing__ ) {
            // A snapshot of the `before` condition of this state is taken,
            // to be compared later with an `after` snapshot.
            before = this.express();
        }

        // This invocation of `mutate` utilizes the set of privileged `add*`
        // methods, however, since they are being called as part of a single
        // operation, each must suppress its usual emission of its own
        // `mutate` event.
        this.__atomic__ = true;

        // Data is already set up to handle differentials that contain `NIL`
        // values.
        data && expr.data && this.data( expr.data );

        // Methods are stored as a simple key mapping, and
        // [`addMethod`](#state--privileged--add-method) can be used both to
        // create an entry and to update an existing entry, without any
        // additional side-effects, so method expressions can simply be
        // compared against the `NIL` value.
        emitter = methods && expr.methods;
        for ( name in emitter ) {
            if ( O.hasOwn.call( emitter, name ) ) {
                value = emitter[ name ];
                value !== NIL ?
                    this.addMethod( name, value ) :
                    this.removeMethod( name );
            }
        }

        // Event listeners for a given event type might be expressed as a
        // simple `Array` of items to be added, as a plain `Object` that
        // maps items to specific keys in the internal event emitter that
        // should be updated or deleted, or as an `Array` that also includes
        // one or more such `Object`s.
        if ( events && expr.events ) {
            O.forEach( expr.events, function ( object, type ) {
                var items, edit, add, i, l,
                    eventCollection = events[ type ];

                if ( object === NIL ) {
                    return eventCollection && eventCollection.empty();
                }

                // If an event emitter object does not already exist for
                // this event type, then one will be created, so long as
                // `object` is expected to contain items to be added.
                if ( !eventCollection && object && !O.isEmpty( object ) ) {
                    eventCollection = events[ type ] =
                        new StateEventEmitter( self, type );
                }

                items = eventCollection.items;

                edit = function ( object ) {
                    var key, value;
                    for ( key in object ) {
                        if ( O.hasOwn.call( object, key ) ) {
                            value = object[ key ];
                            if ( value === NIL ) {
                                eventCollection.remove( key );
                            } else if ( value && value !== items[ key ] ) {
                                eventCollection.set( key, value );
                            }
                        }
                    }
                };

                if ( O.isArray( object ) ) {
                    add = function ( object ) {
                        return self.addEvent( type, object );
                    };
                    for ( i = 0, l = object.length; i < l; i++ ) {
                        value = object[i];
                        if ( value == null || value === NIL ) continue;
                        ( O.isPlainObject( value ) ? edit : add )( value );
                    }
                } else if ( O.isPlainObject( object ) ) {
                    edit( object );
                }

                eventCollection.length ||
                    eventCollection.destroy() && delete events[ type ];
            });
        }

        // Guards are stored as simple objects, and altering them causes no
        // side-effects, so a deep `edit` is sufficient.
        guards && expr.guards && O.edit( 'deep', guards, expr.guards );

        // Substates are instances of [`State`](#State), which are either
        // created, destroyed, or recursively updated in place, as specified
        // by `expr.states`.
        emitter = substates && expr.states;
        for ( name in emitter ) if ( O.hasOwn.call( emitter, name ) ) {
            value = emitter[ name ];
            if ( name in substates ) {
                value === NIL ?
                    substates[ name ].destroy() :
                    substates[ name ].mutate( value, false );
            } else {
                this.addSubstate( name, value );
            }
        }

        // Transitions are instances of
        // [`TransitionExpression`](#transition-expression), which are
        // either created, deleted, or replaced, as specified by
        // `expr.transitions`.
        emitter = transitions && expr.transitions;
        for ( name in emitter ) if ( O.hasOwn.call( emitter, name ) ) {
            value = emitter[ name ];
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

        // Allow `add*` methods to emit individual `mutate` events normally.
        delete this.__atomic__;

        // Finally the `before` snapshot is used to acquire the `delta` of the
        // mutation, which is emitted as part of a `mutate` event.
        if ( before ) {
            after = this.express();
            delta = O.diff( before, after );
            if ( !O.isEmpty( delta ) ) {
                this.emit( 'mutate', [ expr, delta, before, after ], false );
            }
        }

        return this;
    };
};

// #### [mutate](#state--prototype--mutate)
// 
// By default states are weakly immutable and their contents cannot be
// changed, so they will not possess a `mutate` instance method unless they
// bear the `mutable` attribute. However, because a weak-immutable superstate
// may contain mutable substates, any parts of a mutation operation that
// correspond to mutable states must be recursed.
//
// > See also: [mutate (instance)](#state--privileged--mutate)
State.prototype.mutate = function ( expr ) {
    var name, value,
        NIL = O.NIL,
        ss = expr.states,
        substates = this.substates();

    for ( name in ss ) if ( O.hasOwn.call( ss, name ) ) {
        value = ss[ name ];
        if ( name in substates ) {
            value !== NIL && substates[ name ].mutate( value, false );
        } else {
            this.addSubstate( name, value );
        }
    }
};
