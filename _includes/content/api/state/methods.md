### [Methods](#state--methods)


#### [realize](#state--methods--realize)

Transforms `this` [virtual state](/docs/#concepts--inheritance--virtual-epistates) into a “real” state that can bear content of its own.

###### Syntax

{% highlight javascript %}
this.realize()
{% endhighlight %}

###### Returns

`this`

###### Examples

If `this` is already real instead of virtual, then calling `realize` has no effect.

{% highlight javascript %}
{% include examples/api/state/methods--realize--1.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--realize--1.coffee %}
{% endhighlight %}

If `this` is both `virtual` and `mutable`, then calling any of its `add...` methods necessarily uses `realize` to transform into a real state before content is added.

{% highlight javascript %}
{% include examples/api/state/methods--realize--2.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--realize--2.coffee %}
{% endhighlight %}

###### See also

> [Protostates and epistates](/docs/#concepts--inheritance--protostates-and-epistates)
> [Virtual epistates](/docs/#concepts--inheritance--virtual-epistates)
> [`State realize`](/source/#state--private--realize)
> [`State.privileged.realize`](/source/#state--privileged--realize)


#### [destroy](#state--methods--destroy)

Attempts to cleanly destroy `this` state and all of its descendant states.

###### Syntax

{% highlight javascript %}
this.destroy()
{% endhighlight %}

###### Returns

`true` if `this` state is successfully destroyed, or `false` otherwise.

###### Notes

A `destroy` event is issued by each state as it is destroyed.

If the root state is destroyed, the owner is given back any methods it bore prior to its state implementation.

###### See also

> [`State.privileged.destroy`](/source/#state--privileged--destroy)



### Methods: expression and mutation


#### [express](#state--methods--express)

Produces an object containing an expression of the contents of `this` state, such as would be sufficient to create a new `State` structurally identical to `this`.

###### Syntax

{% highlight javascript %}
this.express( typed )
{% endhighlight %}

###### Parameters

* [`typed = false`] : boolean

###### Returns

The generated plain-object, or equivalent `StateExpression` if `typed` is `true`.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--express.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--express.coffee %}
{% endhighlight %}

###### See also

> [Expressions](/docs/#concepts--expressions)
> [`State.privileged.express`](/source/#state--privileged--express)


#### [mutate](#state--methods--mutate)

Transactionally mutates `this` state by adding, updating, or removing items as implied by the contents of `expression`.

###### Syntax

{% highlight javascript %}
this.mutate( expression )
{% endhighlight %}

###### Parameters

* `expression` : ( `StateExpression` | object )

###### Returns

`this`

###### Notes

Property removal is indicated with a value equal to the unique `O.NIL` reference.

If the transaction causes a mutation, `this` emits a [`mutate` event](#state--events--mutate).

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--mutate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--mutate.coffee %}
{% endhighlight %}

###### See also

> [Mutation events](/docs/#concepts--events--mutation)
> [`State.privileged.mutate`](/source/#state--privileged--mutate)
> [`State::mutate`](/source/#state--prototype--mutate)



### Methods: object model


#### [derivation](#state--methods--derivation)

Describes the superstate chain of `this` as an array.

###### Syntax

{% highlight javascript %}
this.derivation( byName )
{% endhighlight %}

###### Parameters

* [`byName = false`] : boolean

###### Returns

An `Array` containing each `State` from the root state to `this` state, starting with the immediate substate from the root.

If `byName` is `true`, the returned `Array` contains the string names of each state, rather than the `State`s themselves.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--derivation.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--derivation.coffee %}
{% endhighlight %}

###### See also

> [`State::derivation`](/source/#state--prototype--derivation)


#### [path](#state--methods--path)

Describes the superstate chain of `this` as a dot-delimited string.

###### Syntax

{% highlight javascript %}
this.path()
{% endhighlight %}

###### Returns

A string that matches the absolute selector referencing `this` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--path.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--path.coffee %}
{% endhighlight %}

###### See also

> [`State::path`](/source/#state--prototype--path)


#### [depth](#state--methods--depth)

Quantifies the height of the superstate chain of `this`.

###### Syntax

{% highlight javascript %}
this.depth()
{% endhighlight %}

###### Returns

The number of superstates separating `this` state from its root state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--depth.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--depth.coffee %}
{% endhighlight %}

###### See also

> [`State::depth`](/source/#state--prototype--depth)


#### [common](#state--methods--common)

Establishes the hierarchical relation between `this` and another `State`.

###### Syntax

{% highlight javascript %}
this.common( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

The `State` that is the nearest common ancestor of both `this` state and the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--common.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--common.coffee %}
{% endhighlight %}

###### See also

> [`State::common`](/source/#state--prototype--common)


#### [is](#state--methods--is)

Asserts identity.

###### Syntax

{% highlight javascript %}
this.is( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is.coffee %}
{% endhighlight %}

###### See also

> [`State::is`](/source/#state--prototype--is)


#### [isIn](#state--methods--is-in)

Asserts descendant familiarity.

###### Syntax

{% highlight javascript %}
this.isIn( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is or is a substate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-in.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-in.coffee %}
{% endhighlight %}

###### See also

> [`State::isIn`](/source/#state--prototype--is-in)


#### [hasSubstate](#state--methods--has-substate)

Asserts ancestral familiarity.

###### Syntax

{% highlight javascript %}
this.hasSubstate( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is or is a superstate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--has-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--has-substate.coffee %}
{% endhighlight %}

###### See also

> [`State::hasSubstate`](/source/#state--prototype--has-substate)


#### [isSuperstateOf](#state--methods--is-superstate-of)

Asserts hierarchical ancestry.

###### Syntax

{% highlight javascript %}
this.isSuperstateOf( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is a superstate of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-superstate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-superstate-of.coffee %}
{% endhighlight %}

###### See also

> [**superstate**](#state--superstate)

> [`State::isSuperstateOf`](/source/#state--prototype--is-superstate-of)


#### [protostate](#state--methods--protostate)

Identifies the `State` analogous to `this` owned by a prototype of the `owner`.

###### Syntax

{% highlight javascript %}
this.protostate()
{% endhighlight %}

###### Returns

The **protostate** of `this`: that `State` which both has a derivation `path` identical to the `path` of `this`, and whose `owner` is the nearest possible prototype of the `owner` of `this`.

Returns `undefined` if no protostate exists anywhere in the owner’s prototype chain.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--protostate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--protostate.coffee %}
{% endhighlight %}

###### See also

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::protostate`](/source/#state--prototype--protostate)


#### [isProtostateOf](#state--methods--is-protostate-of)

Asserts prototypal ancestry.

###### Syntax

{% highlight javascript %}
this.isProtostateOf( other )
{% endhighlight %}

###### Parameters

* `other` : ( `State` | string )

###### Returns

A boolean indicating whether `this` state is a **protostate** of the provided `other` state.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--is-protostate-of.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-protostate-of.coffee %}
{% endhighlight %}

###### See also

> [**protostate**](#state--protostate)

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)
> [`State::isProtostateOf`](/source/#state--prototype--is-prototstate-of)


#### [defaultSubstate](#state--methods--default-substate)

Resolves the proper concretion for an abstract state.

###### Syntax

{% highlight javascript %}
this.defaultSubstate( viaProto )
{% endhighlight %}

###### Parameters

* [`viaProto = true`] : boolean

###### Returns

The `State` that is `this` state’s first substate bearing the `default` attribute, or just the first substate if none are found.

###### Example

{% highlight javascript %}
{% include examples/api/state/methods--default-substate.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--default-substate.coffee %}
{% endhighlight %}

> 1. `Moving` is explicitly marked `default`.

> 2. Since `Moving`, which is itself abstract, has no descendant states marked `default`, its first substate `Walking` serves as its default state.

> 3. A transition targeting the root state will fall through to `Walking`, since both the root and its default state `Moving` are abstract.

###### See also

> [`State::defaultSubstate`](/source/#state--prototype--default-substate)


#### [initialSubstate](#state--methods--initial-substate)

###### Syntax

{% highlight javascript %}
this.initialSubstate()
{% endhighlight %}

###### Returns

The `State` that is `this` state’s most deeply nested state bearing the `initial` attribute, by way of its greatest `initial` descendant state.

###### See also

> [`State::initialSubstate`](/source/#state--prototype--initial-substate)


#### [query](#state--methods--query)

Alias: **match**

Matches a `selector` string with the state or states it represents in the context of `this` state.

###### Syntax

{% highlight javascript %}
this.query( selector, against, descend, ascend, viaProto )
{% endhighlight %}

###### Parameters

* `selector` : string
* [`against`] : `State`
* [`via = VIA_ALL`] : number

The `via` parameter is a bit-field integer comprised of one or more of the `TRAVERSAL_FLAGS` constants:

* `VIA_SUB`
* `VIA_SUPER`
* `VIA_PROTO`

By default `via` is `VIA_ALL` (`~0`), which implies each of the flags’ bits are set, and consequently that the `query` operation will be recursed, in order, over the substates, superstates, and protostates of `this`. Providing a `via` argument that unsets any of the `VIA_SUB`, `VIA_SUPER`, or `VIA_PROTO` bits will disable recursion through the substates, superstates, or protostates, respectively, of `this`.

###### Returns

The nearest matching `State`, or if a non-specific `selector` is provided, an `Array` containing the set of matched states. If a state to be tested `against` is provided, then a boolean is returned, indicating whether `against` is the matched state itself or is included in the matching set.

###### Notes

Calling an owner object’s accessor method with a selector string invokes `query` on the owner’s current state.

###### See also

> [Getting started](/docs/#getting-started)
> [Selectors](/docs/#concepts--selectors)
> [`State::query`](/source/#state--prototype--query)


#### [$](#state--methods--dollarsign)

Convenience method that mimics the behavior of the owner’s accessor method.

###### Syntax

{% highlight javascript %}
this.$( selector )
{% endhighlight %}

###### Parameters

* `selector` : string

###### Returns

If the first argument is a transition arrow selector string, the call is aliased to [`change`](#state--methods--change). If passed a plain selector string, the call is aliased to [`query`](#state--methods--query).

###### Examples

{% highlight javascript %}
this.$('-> Awake')
{% endhighlight %}
{% highlight coffeescript %}
@$ '-> Awake'
{% endhighlight %}

Aliases to [`change`](#state--methods--change), instigating a transition to the `Awake` state.

{% highlight javascript %}
this.$('Awake')
{% endhighlight %}
{% highlight coffeescript %}
@$ 'Awake'
{% endhighlight %}

Aliases to [`query`](#state--methods--query), returning the `State` named `'Awake'`.



### Methods: currency

The **currency methods** in this section determine or decide which of an owner object’s `State`s are presently **current** or **active**, and thus presently influence the behavior exhibited by the owner.


#### [current](#state--methods--current)

{% highlight javascript %}
this.current()
{% endhighlight %}

Returns the current `State` of `this` state’s owner.


#### [isCurrent](#state--methods--is-current)

{% highlight javascript %}
this.isCurrent()
{% endhighlight %}

Returns a boolean indicating whether `this` state is the owner’s current state.


#### [isActive](#state--methods--is-active)

{% highlight javascript %}
this.isActive()
{% endhighlight %}

Returns a boolean indicating whether `this` state or one of its substates is the owner’s current state.


#### [change](#state--methods--change)

Aliases: **go**, **be**

{% highlight javascript %}
this.change( target, options )
{% endhighlight %}

* `target` : ( `State` | string )
* [`options`] : object

Attempts to execute a state transition. Handles asynchronous transitions, generation of appropriate events, and construction of any necessary temporary virtual states. Respects guards supplied in both the origin and `target` states.

The `target` parameter may be either a `State` object within the purview of this controller, or a string that resolves to a likewise targetable `State` when evaluated from the context of the most recently current state.

The `options` parameter is an optional map that may include:

* `args` : `Array` — arguments to be passed to a transition’s `action` function.
* `success` : function — callback to be executed upon successful completion of the transition.
* `failure` : function — callback to be executed if the transition attempt is blocked by a guard.


* * *

The **attribute methods** in this section are predicates that inspect the attributes that have been affixed to a `State`.

> [Attributes](/docs/#concepts--attributes)
> [`state/attributes.js`](/source/#state--attributes.js)


#### [isVirtual](#state--methods--is-virtual)

{% highlight javascript %}
this.isVirtual()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `virtual` attribute.

A **virtual state** is a lightweight inheritor of a **protostate** located higher in the owner object’s prototype chain. Notably, as virtual states are created automatically, no modifier keyword exists for the `virtual` attribute.

{% highlight javascript %}
{% include examples/api/state/methods--is-virtual.js %}
{% endhighlight %}

{% highlight coffeescript %}
{% include examples/api/state/methods--is-virtual.coffee %}
{% endhighlight %}

> 1. The `mover` instance, which inherits its stateful implementation from `Mover.prototype`, does not have a real `Stationary` state of its own, so a virtual `Stationary` state is created automatically and adopted as `mover`’s initial state.

> 2. Root states are never virtualized. Even an object that inherits all statefulness from its prototypes is given a real root state.

> [Protostates](/docs/#concepts--inheritance--protostates-and-epistates)


#### [isMutable](#state--methods--is-mutable)

{% highlight javascript %}
this.isMutable()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `mutable` attribute.

By default, states are **weakly immutable**; i.e., once a `State` has been constructed, its declared data, methods, guards, substates, and transitions cannot be altered. By including the `mutable` attribute in the state’s expression, this restriction is lifted. Mutability is also inherited from any of a state’s superstates or protostates.

> See also:
> [`mutable`](#state--attributes--mutable)


#### [isFinite](#state--methods--is-finite)

{% highlight javascript %}
this.isFinite()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `finite` attribute.

If a state is declared `finite`, no substates or descendant states may be added, nor may any be removed without also destroying the state itself.

> See also:
> [`finite`](#state--attributes--finite)


#### [isImmutable](#state--methods--is-immutable)

{% highlight javascript %}
this.isImmutable()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `immutable` attribute.

A literal or inherited `immutable` attribute causes a state to become **strongly immutable**, wherein it guarantees immutability absolutely, throughout all inheriting states. The `immutable` attribute also implies `finite`, and contradicts and overrides any literal or inherited `mutable` attribute.

> See also:
> [`immutable`](#state--attributes--immutable)


#### [isAbstract](#state--methods--is-abstract)

{% highlight javascript %}
this.isAbstract()
{% endhighlight %}

Returns a boolean indicating whether `this` state is `abstract`.

An `abstract` state is used only as a source of inheritance, and cannot itself be current. A transition that directly targets an abstract state will be automatically redirected to one of its substates.

> See also:
> [`abstract`](#state--attributes--abstract)


#### [isConcrete](#state--methods--is-concrete)

{% highlight javascript %}
this.isConcrete()
{% endhighlight %}

Returns a boolean indicating whether `this` state is `concrete`.

All non-abstract states are concrete. Marking a state with the `concrete` attribute in a state expression will override any `abstract` attribute, particularly such as would otherwise be inherited from a protostate.

> See also:
> [`concrete`](#state--attributes--concrete)


#### [isDefault](#state--methods--is-default)

{% highlight javascript %}
this.isDefault()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `default` attribute.

Marking a state `default` designates it as the specific redirection target for any transition that targets its abstract superstate.

> See also:
> [`default`](#state--attributes--default),
> [`defaultSubstate`](#state--methods--default-substate)


#### [isInitial](#state--methods--is-initial)

{% highlight javascript %}
this.isInitial()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `initial` attribute.

Marking a state `initial` specifies which state a newly stateful object should assume.

Objects inheriting from a stateful prototype will have their initial state set to the prototype’s current state.

> See also:
> [`initial`](#state--attributes--initial),
> [`initialSubstate`](#state--methods--initial-substate)


#### [isConclusive](#state--methods--is-conclusive)

{% highlight javascript %}
this.isConclusive()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `conclusive` attribute.

Once a state marked `conclusive` is entered, it cannot be exited, although transitions may still freely traverse within its substates.

> See also:
> [`conclusive`](#state--attributes--conclusive)


#### [isFinal](#state--methods--is-final)

{% highlight javascript %}
this.isFinal()
{% endhighlight %}

Returns a boolean indicating whether `this` state bears the `final` attribute.

Once a state marked `final` is entered, no further outbound transitions within its local region are allowed.

> See also:
> [`final`](#state--attributes--final)


* * *

The methods below allow states to store and manipulate arbitrary **data**.

> [Data](/docs/#concepts--data)
> [`state/data.js`](/source/#state--data.js)


#### [data](#state--methods--data)

{% highlight javascript %}
this.data( viaSuper, viaProto )
{% endhighlight %}

* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Returns an object clone of the data attached to `this` state, including any data inherited from protostates and superstates, unless specified otherwise by the inheritance flags `viaSuper` and `viaProto`.

{% highlight javascript %}
this.data( edit )
{% endhighlight %}

* `edit` : object

Adds, updates, and/or removes `data` properties on `this` state, and returns `this`.

For any keys in `edit` whose values are set to the `O.NIL` directive, the matching properties are deleted from `this` state’s data.

If the operation results in a change to `this` state’s data, a `mutate` event is emitted.

> [`State.privileged.data`](/source/#state--privileged--data)


#### [has](#state--methods--has)

{% highlight javascript %}
this.has( key, viaSuper, viaProto )
{% endhighlight %}

* `key` : string
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Predicate that determines whether a `data` property with the given `key` exists on `this` state, or is inherited from a protostate or superstate. Supports `long.key` lookups for deeply nested properties.

> [`State.privileged.has`](/source/#state--privileged--has)


#### [get](#state--methods--get)

{% highlight javascript %}
this.get( key, viaSuper, viaProto )
{% endhighlight %}

* `key` : string
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Returns the value of the `data` property with the given `key` on `this` state, or one inherited from the nearest protostate, or the nearest superstate. Supports `long.key` lookups for deeply nested properties. Returns `undefined` if `key` cannot be resolved.

> [`State.privileged.get`](/source/#state--privileged--get)


#### [let](#state--methods--let)

{% highlight javascript %}
this.let( key, value )
{% endhighlight %}

* `key` : string
* `value` : var

Creates a new data property or updates an existing data property on `this` state, and returns the assigned `value`. Succeeds only if `this` state is `mutable`. Supports `long.key` assignments to deeply nested properties.

> [`State.privileged.let`](/source/#state--privileged--let)


#### [set](#state--methods--set)

{% highlight javascript %}
this.set( key, value )
{% endhighlight %}

* `key` : string
* `value` : var

Updates an existing `data` property and returns the assigned `value`. If the property is inherited from a `mutable` superstate, then the property is updated in place, equivalent to calling `let` on that superstate. If the data property does not yet exist in the superstate chain, it is created on `this`. Properties inherited from protostates are not affected. Supports `long.key` assignments to deeply nested properties.

> [`State.prototype.set`](/source/#state--prototype--set)


#### [delete](#state--methods--delete)

{% highlight javascript %}
this.delete( key )
{% endhighlight %}

* `key` : string

Deletes an existing `data` property on `this` state. Returns boolean `true` if the deletion was successful or unnecessary, or `false` otherwise, in the same manner as the native `delete` operator. Supports `long.key` lookups for deeply nested properties.

> [`State.prototype.delete`](/source/#state--prototype--delete)


* * *

The methods in this section deal with adding, removing, inspecting, and the application of **state methods**.

> [Methods](/docs/#concepts--methods)
> [`state/methods.js`](/source/#state--methods.js)


#### [method](#state--methods--method)

{% highlight javascript %}
this.method( methodName, viaSuper, viaProto, out )
{% endhighlight %}

* `methodName` : string
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean
* [`out`] : object

Returns the function that is the method held on `this` state whose name is `methodName`.

If the named method does not exist on `this` state, then it will be inherited, in order, first from protostates of `this` (unless `viaProto` is `false`), and if no such method exists there, then from superstates of `this` (unless `viaSuper` is `false`).

If an `out` object is supplied, then the returned `function` is attached to `out.method`, and the `State` context to which the method will be bound when invoked with `this.apply` or `this.call` is attached to `out.context`.

> [`State.privileged.method`](/source/#state--privileged--method)


#### [methodNames](#state--methods--method-names)

{% highlight javascript %}
this.methodNames()
{% endhighlight %}

Returns an `Array` of names of methods defined locally on `this` state.

> [`State.privileged.methodNames`](/source/#state--privileged--method-names)


#### [addMethod](#state--methods--add-method)

{% highlight javascript %}
this.addMethod( methodName, fn )
{% endhighlight %}

* `methodName` : string
* `fn` : function

Adds `fn` as a method named `methodName` to `this` state, which will be callable directly from the owner, but with its context bound to `this`.

Returns `fn`.

> [`State.privileged.addMethod`](/source/#state--privileged--add-method)


#### [removeMethod](#state--methods--remove-method)

{% highlight javascript %}
this.removeMethod( methodName )
{% endhighlight %}

* `methodName` : string

Dissociates the method named `methodName` from `this` state and returns its function.

> [`State.privileged.removeMethod`](/source/#state--privileged--remove-method)


#### [hasMethod](#state--methods--has-method)

{% highlight javascript %}
this.hasMethod( methodName )
{% endhighlight %}

* `methodName` : string

Returns a boolean indicating whether `this` state possesses or inherits a method named `methodName`.

> [`State::hasMethod`](/source/#state--prototype--has-method)


#### [hasOwnMethod](#state--methods--has-own-method)

{% highlight javascript %}
this.hasOwnMethod( methodName )
{% endhighlight %}

* `methodName` : string

Returns a boolean indicating whether `this` state directly possesses a method named `methodName`.

> [`State::hasOwnMethod`](/source/#state--prototype--has-own-method)


#### [apply](#state--methods--apply)

{% highlight javascript %}
this.apply( methodName, args )
{% endhighlight %}

* `methodName` : string
* [`args`] : `Array`

Finds the state method named by `methodName`, applies it with the provided `args` in the appropriate context, and returns its result.

If the method was originally defined in the owner, the context will be the owner. Otherwise, the context will either be the precise `State` in which the method is defined, or if the method resides in a protostate, the corresponding `State` belonging to the inheriting owner.

If the named method does not exist locally and cannot be inherited, a `noSuchMethod` event is emitted and the call returns `undefined`.

> [`State::apply`](/source/#state--prototype--apply)


#### [call](#state--methods--call)

{% highlight javascript %}
this.call( methodName, args... )
{% endhighlight %}

* `methodName` : string
* [`args...`] : *individual arguments*

The variadic companion to `apply`.

> [`State::call`](/source/#state--prototype--call)



* * *

The **event methods** in this section are an implementation of the common **event emitter** pattern.

> See also: [Events](#state--events)

> [Events](/docs/#state--events)
> [`state/events.js`](/source/#state--events.js)


#### [event](#state--methods--event)

{% highlight javascript %}
this.event( eventType, id )
{% endhighlight %}

* `eventType` : string
* [`id`] : ( string | number | function )

Returns a registered event listener, or the number of listeners registered, for a given `eventType`.

If an `id` as returned by [`addEvent`](#state--add-event) is provided, the event listener associated with that `id` is returned. If no `id` is provided, the number of event listeners registered to `eventType` is returned.

> [`State.privileged.event`](/source/#state--privileged--event)


#### [addEvent](#state--methods--add-event)

Aliases: **on**, **bind**

{% highlight javascript %}
this.addEvent( eventType, fn, context )
{% endhighlight %}

* `eventType` : string
* `fn` : function
* [`context = this`] : object

Binds an event listener `fn` to the specified `eventType` and returns a unique identifier for the listener.

> [`State.privileged.addEvent`](/source/#state--privileged--add-event)


#### [removeEvent](#state--methods--remove-event)

Aliases: **off**, **unbind**

{% highlight javascript %}
this.removeEvent( eventType, id )
{% endhighlight %}

* `eventType` : string
* [`id`] : ( string | number | function )

Unbinds the event listener with the specified `id` that was supplied by `addEvent`.

> [`State.privileged.removeEvent`](/source/#state--privileged--remove-event)


#### [emit](#state--methods--emit)

Aliases: **trigger**

{% highlight javascript %}
this.emit( eventType, args, context, viaSuper, viaProto )
{% endhighlight %}

* `eventType` : string
* [`args = []`] : `Array`
* [`context = this`] : object
* [`viaSuper = true`] : boolean
* [`viaProto = true`] : boolean

Invokes all listeners bound to the given `eventType`.

Arguments for the listeners can be passed as an array to the `args` parameter.

Listeners are invoked in the context of `this` state, or as specified by `context`.

Listeners bound to superstates and protostates of `this` are also invoked, unless otherwise directed by setting `viaSuper` or `viaProto` to `false`.

> [`State.privileged.emit`](/source/#state--privileged--emit)



* * *

> [Guards](/docs/#concepts--guards)
> [`state/guards.js`](/source/#state--guards.js)


#### [guard](#state--methods--guard)

{% highlight javascript %}
this.guard( guardType )
{% endhighlight %}

* `guardType` : string

Returns an object containing the guard predicates and/or expressions for the specified `guardType` held on `this` state.

A **guard** is a map of functions or values that will be evaluated as either a predicate or boolean expression, respectively, to provide a determination of whether the owner’s currency will be admitted into or released from the state to which the guard is applied.

Valid `guardType`s include `admit` and `release`.

Guards are inherited from protostates, but not from superstates.

> [`State.privileged.guard`](/source/#state--privileged--guard)


#### [addGuard](#state--methods--add-guard)

{% highlight javascript %}
this.addGuard( guardType, guard )
{% endhighlight %}

* `guardType` : string
* `guard` : object

Adds a guard to `this` state, or augments an existing guard with additional entries.

> [`State.privileged.addGuard`](/source/#state--privileged--add-guard)


#### [removeGuard](#state--methods--remove-guard)

{% highlight javascript %}
this.removeGuard( guardType, keys )
{% endhighlight %}

* `guardType` : string
* [`keys`] : ( `Array` | string )

Removes a guard from `this` state, or removes specific entries from an existing guard.

> [`State.privileged.removeGuard`](/source/#state--privileged--remove-guard)



* * *

> [Superstates and substates](/docs/#concepts--inheritance--superstates-and-substates)
> [`state/model.js`](/source/#state--model.js)


#### [substate](#state--methods--substate)

{% highlight javascript %}
this.substate( stateName, viaProto )
{% endhighlight %}

* `stateName` : string
* [`viaProto = true`] : boolean

Returns the substate of `this` state named `stateName`. If no such substate exists locally within `this`, and `viaProto` is `true`, then the nearest identically named substate held on a protostate will be returned.

> [`State.privileged.substate`](/source/#state--privileged--substate)


#### [substates](#state--methods--substates)

{% highlight javascript %}
this.substates( deep, virtual )
{% endhighlight %}

* [`deep = false`] : boolean
* [`virtual = false`] : boolean

Returns an `Array` of `this` state’s substates.

If `deep` is `true`, the returned array is a depth-first flattened list of all of this state’s descendant states.

If `virtual` is `true`, the returned array may include any active virtual states held by an owner object that is inheriting currency from a prototype.

> [`State.privileged.substates`](/source/#state--privileged--substates)


#### [addSubstate](#state--methods--add-substate)

{% highlight javascript %}
this.addSubstate( stateName, stateExpression )
{% endhighlight %}

* `stateName` : string
* `stateExpression` : ( `StateExpression` | object | `State` )

Creates a `State` based on the provided `stateExpression`, adds it as a substate of `this` state, and returns the new `State`.

If a substate with the same `stateName` already exists, it is first destroyed and then replaced.

> [`State.privileged.addSubstate`](/source/#state--privileged--add-substate)


#### [removeSubstate](#state--methods--remove-substate)

{% highlight javascript %}
this.removeSubstate( stateName )
{% endhighlight %}

* `stateName` : string

Removes the substate named by `stateName` from `this` state, if possible, and returns the removed `State`.

If the owner object is in the midst of a transition involving the state targeted for removal, then the removal will fail, returning `false`.

> [`State.privileged.removeSubstate`](/source/#state--privileged--remove-substate)


* * *


#### [transition](#state--methods--transition)

{% highlight javascript %}
this.transition( transitionName )
{% endhighlight %}

* `transitionName` : string

Returns the transition expression named by `transitionName` registered to `this` state.


#### [transitions](#state--methods--transitions)

{% highlight javascript %}
this.transitions()
{% endhighlight %}

Returns an object containing all of the transition expressions registered to `this` state.


#### [addTransition](#state--methods--add-transition)

{% highlight javascript %}
this.addTransition( transitionName, transitionExpression )
{% endhighlight %}

* `transitionName` : string
* `transitionExpression` : ( `TransitionExpression` | object )

Registers a transition expression to `this` state.


#### [removeTransition](#state--methods--remove-transition)

{% highlight javascript %}
this.removeTransition( transitionName )
{% endhighlight %}

Removes a registered transition expression from `this` state.
