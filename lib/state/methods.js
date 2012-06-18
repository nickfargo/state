// <a class="icon-link"
//    name="state--methods.js"
//    href="#state--methods.js"></a>
// 
// ### `state/methods.js`

Z.assign( State.privileged, {

    // <a class="icon-link"
    //    name="state--privileged--method"
    //    href="#state--privileged--method"></a>
    // 
    // #### method
    // 
    // Retrieves the named method held on this state. If no method is found,
    // step through this state’s protostate chain to find one. If no method is
    // found there, step up the superstate hierarchy and repeat the search.
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
                if ( out ) {
                    out.context = this; out.method = method;
                }
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
                    method = superstate.method( methodName, true, viaProto,
                        out );
                    if ( method ) return method;
                }
            }

            if ( out ) {
                out.context = null; out.method = method;
            }
            
            return method;
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--method-names"
    //    href="#state--privileged--method-names"></a>
    // 
    // #### methodNames
    // 
    // Returns an `Array` of names of methods defined for this state.
    methodNames: function ( methods ) {
        return function () {
            return Z.keys( methods );
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--add-method"
    //    href="#state--privileged--add-method"></a>
    // 
    // #### addMethod
    // 
    // Adds a method to this state, which will be callable directly from the
    // owner, but with its context bound to the state.
    // 
    // *See also:* [`State createDelegator`](#state--private--create-delegator)
    addMethod: function ( methods ) {

        // ##### createDelegator
        // 
        // Creates a function that will serve as a **delegator** method on an
        // owner object. For each method defined in any of the owner’s states,
        // a delegator must be created and assigned on the owner itself, at
        // the `methodName` key. This delegator then forwards any calls to
        // `methodName` to the owner’s current state, which will locate the
        // appropriate implementation for the method, apply it, and return the
        // result.
        // 
        // If an owner already has an implementation for a delegated method,
        // it is copied into the owner’s root state, such that it remains
        // accessible as the owner’s “default behavior” if none of its active
        // states contains an implementation for that method.
        // 
        // Stateful methods are applied in the context of the [`State`](#state)
        // to which they belong, or, if a method is inherited from a
        // protostate, the context will be the corresponding virtual state
        // within the local [`StateController`](#state-controller). However,
        // for any a priori methods relocated to the root state, the context
        // appropriately remains bound to the owner object.
        function createDelegator ( accessorKey, methodName, original ) {
            function delegator () {
                return this[ accessorKey ]().apply( methodName, arguments );
            }

            delegator.isDelegator = true;
            if ( Z.env.debug ) {
                delegator.toString = function () { return "[delegator]"; };
            }

            original && ( delegator.original = original );

            return delegator;
        }

        return function ( /*String*/ methodName, /*Function*/ fn ) {
            var controller = this.controller(),
                controllerName = controller.name(),
                root = controller.root(),
                owner = controller.owner(),
                ownerMethod;

            // If there is not already a method called `methodName` in the
            // state hierarchy, then the owner and controller need to be set up
            // properly to accommodate calls to this method.
            if ( !this.method( methodName, true, false ) ) {
                if ( this !== root &&
                    !root.method( methodName, false, false )
                ) {
                    ownerMethod = owner[ methodName ];
                    if ( ownerMethod === undefined || ownerMethod.isDelegator ) {
                        ownerMethod = Z.noop;
                    }
                    root.addMethod( methodName, ownerMethod );
                }

                // A delegator function is instated on the owner, which will
                // direct subsequent calls to `owner[ methodName ]` to the
                // controller, and then on to the appropriate state’s
                // implementation.
                owner[ methodName ] =
                    createDelegator( controllerName, methodName, ownerMethod );
            }

            return methods[ methodName ] = fn;
        };
    },

    // <a class="icon-link"
    //    name="state--privileged--remove-method"
    //    href="#state--privileged--remove-method"></a>
    // 
    // #### removeMethod
    // 
    // Dissociates the named method from this state object and returns its
    // function.
    removeMethod: function ( methods ) {
        return function ( /*String*/ methodName ) {
            var fn = methods[ methodName ];
            delete methods[ methodName ];
            return fn;
        };
    }
});

Z.assign( State.prototype, {
    method: State.privileged.method( null ),
    methodNames: function () { return []; },
    'addMethod removeMethod': Z.noop,

    // <a class="icon-link"
    //    name="state--prototype--has-method"
    //    href="#state--prototype--has-method"></a>
    // 
    // #### hasMethod
    // 
    // Determines whether `this` possesses or inherits a method named
    // `methodName`.
    hasMethod: function ( /*String*/ methodName ) {
        var method = this.method( methodName );
        return method && method !== Z.noop;
    },

    // <a class="icon-link"
    //    name="state--prototype--has-own-method"
    //    href="#state--prototype--has-own-method"></a>
    // 
    // #### hasOwnMethod
    // 
    // Determines whether `this` directly possesses a method named `methodName`.
    hasOwnMethod: function ( /*String*/ methodName ) {
        return !!this.method( methodName, false, false );
    },

    // <a class="icon-link"
    //    name="state--prototype--apply"
    //    href="#state--prototype--apply"></a>
    // 
    // #### apply
    // 
    // Finds a state method and applies it in the appropriate context. If the
    // method was originally defined in the owner, the context will be the
    // owner. Otherwise, the context will either be the state in which the
    // method is defined, or if the implementation resides in a protostate, the
    // corresponding state belonging to the inheriting owner. If the named
    // method does not exist locally and cannot be inherited, a `noSuchMethod`
    // event is emitted and the call returns `undefined`.
    apply: function (
        /*String*/ methodName,
         /*Array*/ args         // optional
    ) {
        var out, method, context, owner, ownerMethod;

        out = { method: undefined, context: undefined };
        method = this.method( methodName, true, true, out );

        if ( !method ) {
            // Observers may listen for either a general `noSuchMethod` event,
            // or one that is specific to a particular method.
            this.emit( 'noSuchMethod', [ methodName, args ] );
            this.emit( 'noSuchMethod:' + methodName, args );
            return;
        }

        context = out.context;
        owner = this.owner();
        ownerMethod = owner[ methodName ];
        if ( ownerMethod && ownerMethod.original && context === this.root() ) {
            context = owner;
        }

        return method.apply( context, args );
    },

    // <a class="icon-link"
    //    name="state--prototype--call"
    //    href="#state--prototype--call"></a>
    // 
    // #### call
    // 
    // Variadic [`apply`](#state--prototype--apply).
    call: function ( /*String*/ methodName ) {
        return this.apply( methodName, Z.slice.call( arguments, 1 ) );
    }
});
